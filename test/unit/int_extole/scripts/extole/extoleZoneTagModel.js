'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Site = {
    current: {
        name: 'SFRA'
    },
    getCurrent() {
        return {
            getCustomPreferenceValue() {
                return 'some value';
            }
        };
    }
};

var ProductMgr = {
    getProduct() {
        return {
            ID: 'some ID',
            name: 'Product Name',
            pageDescription: 'some description',
            constructor: {
                name: 'dw.catalog.Product'
            },
            getName: () => 'some title',
            getImage: () => ({ getAbsURL: () => 'some url' })
        };
    }
};

var CatalogMgr = {
    getCategory() {
        return {
            constructor: {
                name: 'dw.catalog.Category'
            },
            ID: 'some ID',
            pageDescription: 'some description',
            getDisplayName: () => 'some title',
            getImage: () => ({ getAbsURL: () => 'some url' })
        };
    }
};

var OrderMgr = {
    getOrder() {
        return {
            constructor: {
                name: 'dw.order.Order'
            },
            orderNo: 'orderNo',
            giftCertificateTotalPrice: '100',
            customerEmail: 'customerEmail',
            billingAddress: () => ({
                firstName: 'firstName',
                lastName: 'lastName'
            }),
            getAdjustedMerchandizeTotalPrice: () => ({
                add: (val) => ({
                    getDecimalValue: () => val + '00'
                })
            }),
            getCouponLineItems: () => [
                { getCouponCode: () => 'coupon_code1' },
                { getCouponCode: () => 'coupon_code2' },
                { getCouponCode: () => 'coupon_code3' }
            ]
        };
    }
};

var URLUtils = {
    http() {
        return 'some url';
    }
};

var Logger = {
    getLogger: () => ({
        warn: () => null
    })
};

var CurrentRequest = {
    locale: 'en_US',
    httpParameterMap: {
        ID: 'orderNo'
    }
};

var CurrentCustomer = {
    ID: 'some customer ID',
    constructor: {
        name: 'dw.customer.Customer'
    },
    custom: {
        test: 'Custom value'
    },
    profile: {
        firstName: 'some FirstName',
        lastName: 'some LastName',
        email: 'some email'
    },
    getProfile: () => ({
        getCustomerNo: () => '000004'
    })
};

var libExtole = {
    siteLabel: 'SFRA',
    isExtoleEnabled() {
        return 'true';
    },
    getClientName() {
        return 'fluid';
    },
    isApprovalAPIEnabled() {
        return 'true';
    },
    getSiteLabel() {
        return libExtole.siteLabel;
    }
};

var Mac = {};
var Encoding = {};
var Bytes = {};
var productDefaultAttributes = function () {};
var productCustomAttributes = function () {};
var systemObjectAttributes = proxyquire('../../../../../cartridges/int_extole/cartridge/scripts/extole/decorators/systemObjectAttributes.js', {
    'dw/web/URLUtils': URLUtils,
    '*/cartridge/scripts/extole/extoleLogger': Logger
});
var fixedDataAttributes = {};
var tagConfig = {};
var configHelper = {
    getTagConfig: () => tagConfig
};

var { empty } = require('../../../../mocks/global');
global.empty = empty;
global.dw = {
    system: {
        System: {
            getInstanceType: () => 0,
            PRODUCTION_SYSTEM: 2
        }
    }
};

var extoleZoneTagModel = proxyquire('../../../../../cartridges/int_extole/cartridge/scripts/extole/extoleZoneTagModel.js', {
    'dw/system/Site': Site,
    'dw/crypto/Mac': Mac,
    'dw/crypto/Encoding': Encoding,
    'dw/util/Bytes': Bytes,
    '*/cartridge/scripts/extole/libExtole': libExtole,
    '*/cartridge/scripts/extole/decorators/productDefaultAttributes': productDefaultAttributes,
    '*/cartridge/scripts/extole/decorators/productCustomAttributes': productCustomAttributes,
    '*/cartridge/scripts/extole/decorators/systemObjectAttributes': systemObjectAttributes,
    '*/cartridge/scripts/extole/decorators/fixedDataAttributes': fixedDataAttributes,
    '*/cartridge/scripts/extole/configHelper': configHelper
});

var extoleZoneTagObj = {
    name: 'some name',
    element_id: 'some element id',
    data: {
        labels: ['SFRA', 'en_US'],
        sandbox: 'production-qa',
        customer: {
            first_name: 'some FirstName',
            last_name: 'some LastName',
            email: 'some email',
            partner_user_id: '000004'
        },
        content: {
            title: 'some title',
            image_url: 'some url',
            description: 'some description',
            partner_content_id: 'some ID',
            url: 'some url'
        },
        conversion: {
            partner_conversion_id: 'orderNo',
            cart_value: '10000',
            coupon_code: 'coupon_code1,coupon_code2,coupon_code3'
        }
    }
};

function Pdict() {
    this.CurrentRequest = CurrentRequest;
}

var assertGroups = {
    general(pdict, result) {
        assert.equal(result.name, pdict.name);
        assert.equal(result.element_id, pdict.element_id);
        assert.deepEqual(result.data.labels, extoleZoneTagObj.data.labels);
        assert.deepEqual(result.data.sandbox, extoleZoneTagObj.data.sandbox);
    },
    customer(pdict, result) {
        let data = result.data;
        assert.equal(data.first_name, extoleZoneTagObj.data.customer.first_name);
        assert.equal(data.last_name, extoleZoneTagObj.data.customer.last_name);
        assert.equal(data.email, extoleZoneTagObj.data.customer.email);
        assert.equal(data.partner_user_id, extoleZoneTagObj.data.customer.partner_user_id);
    }
};

var makeGeneral = (pdict) => {
    pdict.customer = null; // eslint-disable-line no-param-reassign
    tagConfig = {};
    let result = extoleZoneTagModel.get(pdict);
    assertGroups.general(pdict, result);
};

var makeGeneralAndWIthCustomer = (pdict) => {
    pdict.customer = CurrentCustomer; // eslint-disable-line no-param-reassign
    tagConfig = {
        customer: {
            first_name: 'customer.profile.firstName',
            last_name: 'customer.profile.lastName',
            email: 'customer.profile.email',
            partner_user_id: 'customer.$customerId'
        }
    };
    let result = extoleZoneTagModel.get(pdict);
    assertGroups.general(pdict, result);
    assertGroups.customer(pdict, result);
};

describe('everywhere', () => {
    var pdict = new Pdict();
    pdict.name = 'everywhere';
    pdict.element_id = 'extole_zone_everywhere';

    it('should receive extoleZoneTagObj with default data', () => {
        pdict.customer = null;
        let result = extoleZoneTagModel.get(pdict);
        assert.equal(result.name, 'everywhere');
        assert.equal(result.element_id, 'extole_zone_everywhere');
        assert.equal(result.data.sandbox, 'production-qa');
        assert.deepEqual(result.data.labels, ['SFRA', 'en_US']);
    });

    it('should receive extoleZoneTagObj with customer data', () => {
        pdict.customer = CurrentCustomer;
        tagConfig = {
            customer: {
                first_name: 'customer.profile.firstName',
                last_name: 'customer.profile.lastName',
                email: 'customer.profile.email',
                partner_user_id: 'customer.$customerId'
            }
        };

        let result = extoleZoneTagModel.get(pdict);
        assert.equal(result.name, 'everywhere');
        assert.equal(result.element_id, 'extole_zone_everywhere');
        assert.deepEqual(result.data.labels, ['SFRA', 'en_US']);
        // customer data
        let data = result.data;
        assert.equal(data.first_name, 'some FirstName');
        assert.equal(data.last_name, 'some LastName');
        assert.equal(data.email, 'some email');
        assert.deepEqual(data.partner_user_id, '000004');
    });
});

describe('global_header', () => {
    var pdict = new Pdict();
    pdict.name = 'global_header';
    pdict.element_id = 'extole_zone_global_header';

    it('should receive extoleZoneTagObj without customer data', () => makeGeneral(pdict));
    it('should receive extoleZoneTagObj with customer data', () => makeGeneralAndWIthCustomer(pdict));
    it('should receive extoleZoneTagObj without siteLabel', () => {
        libExtole.siteLabel = '';
        pdict.customer = null;
        let result = extoleZoneTagModel.get(pdict);
        assert.equal(result.name, pdict.name);
        assert.equal(result.element_id, pdict.element_id);
        assert.deepEqual(result.data.labels, ['Sites-SFRA-Site', 'en_US']);
        libExtole.siteLabel = Site.current.name;
    });
});

describe('footer', () => {
    var pdict = new Pdict();
    pdict.name = 'global_header';
    pdict.element_id = 'extole_zone_global_header';

    it('should receive extoleZoneTagObj without customer data', () => makeGeneral(pdict));
    it('should receive extoleZoneTagObj with customer data', () => makeGeneralAndWIthCustomer(pdict));
});

describe('my_account', () => {
    var pdict = new Pdict();
    pdict.name = 'my_account';
    pdict.element_id = 'extole_zone_my_account';

    it('should receive extoleZoneTagObj without customer data', () => makeGeneral(pdict));
    it('should receive extoleZoneTagObj with customer data', () => makeGeneralAndWIthCustomer(pdict));
});

describe('registration', () => {
    var pdict = new Pdict();
    pdict.name = 'registration';

    it('should receive extoleZoneTagObj with customer data and except element_id', () => {
        pdict.customer = CurrentCustomer;
        let result = extoleZoneTagModel.get(pdict);
        assert.equal(result.element_id, null);
        assert.equal(result.name, 'registration');
        assert.deepEqual(result.data.labels, ['SFRA', 'en_US']);
    });

    it('should receive extoleZoneTagObj without customer data', () => {
        pdict.customer = null;
        let result = extoleZoneTagModel.get(pdict);
        assert.equal(result.element_id, null);
        assert.equal(result.name, 'registration');
        assert.deepEqual(result.data.labels, ['SFRA', 'en_US']);
    });
});

describe('homepage', () => {
    var pdict = new Pdict();
    pdict.name = 'homepage';
    pdict.element_id = 'extole-homepage-placement';

    it('should receive extoleZoneTagObj with general data', () => makeGeneral(pdict));
});

describe('homepage_module', () => {
    var pdict = new Pdict();
    pdict.name = 'homepage_module';
    pdict.element_id = 'extole_zone_homepage_module';

    it('should receive extoleZoneTagObj with general data', () => makeGeneral(pdict));
});

describe('product', () => {
    var pdict = new Pdict();
    pdict.name = 'product';
    pdict.element_id = 'extole_zone_product';

    it('should receive extoleZoneTagObj with general data', () => {
        pdict.customer = null; // eslint-disable-line no-param-reassign
        tagConfig = {};
        let result = extoleZoneTagModel.get(pdict);
        assertGroups.general(pdict, result);
    });

    it('should receive extoleZoneTagObj with product data', () => {
        pdict.product = ProductMgr.getProduct();
        tagConfig = {
            'product': {
                'title': 'product.$productTitle',
                'image_url': 'product.$productImageURL',
                'description': 'product.pageDescription',
                'url': 'product.$productURL',
                'partner_content_id': 'product.ID'
            }
        };
        let result = extoleZoneTagModel.get(pdict);
        assertGroups.general(pdict, result);
        let content = result.data.content;
        assert.deepEqual(content, extoleZoneTagObj.data.content);
    });

    it('should receive extoleZoneTagObj without product data', () => {
        pdict.product = null;
        let result = extoleZoneTagModel.get(pdict);
        assertGroups.general(pdict, result);
    });
});

describe('social', () => {
    var pdict = new Pdict();
    pdict.name = 'social';
    pdict.element_id = 'extole_zone_social';

    it('should receive extoleZoneTagObj with general data', () => makeGeneral(pdict));
});

describe('category', () => {
    var pdict = new Pdict();
    pdict.name = 'category';
    pdict.element_id = 'extole_zone_category';

    it('should receive extoleZoneTagObj with general data', () => makeGeneral(pdict));

    it('should receive extoleZoneTagObj with category data', () => {
        pdict.category_obj = CatalogMgr.getCategory();
        tagConfig = {
            category: {
                title: 'category.$categoryTitle',
                image_url: 'category.$categoryImageURL',
                description: 'category.pageDescription',
                url: 'category.$categoryURL'
            }
        };

        let result = extoleZoneTagModel.get(pdict);
        assertGroups.general(pdict, result);
        let content = result.data.content;
        let mockup = JSON.parse(JSON.stringify(extoleZoneTagObj.data.content));
        delete mockup.partner_content_id;
        assert.deepEqual(content, mockup);
    });
});

describe('confirmation', () => {
    var pdict = new Pdict();
    pdict.name = 'confirmation';
    pdict.element_id = 'extole_zone_confirmation';
    pdict.order_obj = OrderMgr.getOrder();

    it('should receive extoleZoneTagObj with general data', () => makeGeneral(pdict));
});

describe('conversion', () => {
    var pdict = new Pdict();
    pdict.name = 'conversion';

    it('should receive extoleZoneTagObj with general data except element_id', () => {
        let result = extoleZoneTagModel.get(pdict);
        assert.equal(result.element_id, null);
        assert.equal(result.name, 'conversion');
        assert.deepEqual(result.data.labels, ['SFRA', 'en_US']);
    });

    it('should receive extoleZoneTagObj with order data', () => {
        pdict.order_obj = OrderMgr.getOrder();
        tagConfig = {
            order: {
                partner_conversion_id: 'order.orderNo',
                cart_value: 'order.$cartValue',
                coupon_code: 'order.$couponList',
                first_name: 'order.billingAddress.firstName',
                last_name: 'order.billingAddress.lastName',
                email: 'order.customerEmail',
                partner_user_id: 'order.customerNo'
            }
        };
        let result = extoleZoneTagModel.get(pdict);
        assertGroups.general(pdict, result);
        assert.deepEqual({
            partner_conversion_id: result.data.partner_conversion_id,
            cart_value: result.data.cart_value,
            coupon_code: result.data.coupon_code
        }, extoleZoneTagObj.data.conversion);
    });
});
