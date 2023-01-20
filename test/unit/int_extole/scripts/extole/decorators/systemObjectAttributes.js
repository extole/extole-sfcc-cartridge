'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var URLUtils = {
    http(endpoint, key, id) {
        return endpoint + '?' + key + '=' + id;
    }
};

var Logger = {
    getLogger() {
        return null;
    }
};

var addAttributes = proxyquire('../../../../../../cartridges/int_extole/cartridge/scripts/extole/decorators/systemObjectAttributes.js', {
    'dw/web/URLUtils': URLUtils,
    '*/cartridge/scripts/extole/extoleLogger': Logger
});

var { empty } = require('../../../../../mocks/global');
global.empty = empty;

var source = {
    customer: {
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
    },
    product: {
        ID: 'some ID',
        name: 'Product Name',
        pageDescription: 'some category',
        constructor: {
            name: 'dw.catalog.Product'
        },
        getName: () => 'some title',
        getImage: () => ({ getAbsURL: () => 'some url' })
    },
    order: {
        constructor: {
            name: 'dw.order.Order'
        },
        orderNo: 'orderNo',
        giftCertificateTotalPrice: '100',
        customerEmail: 'some email',
        customerNo: '00004',
        billingAddress: {
            firstName: 'firstName',
            lastName: 'lastName'
        },
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
    },
    category: {
        constructor: {
            name: 'dw.catalog.Category'
        },
        ID: 'some ID',
        pageDescription: 'some category',
        getDisplayName: () => 'some title',
        getImage: () => ({ getAbsURL: () => 'some url' })
    }
};

var modelObj = {
    customer: {
        email: 'some email',
        first_name: 'some FirstName',
        key: 'value',
        last_name: 'some LastName',
        partner_user_id: '000004'
    },
    product: {
        description: 'some category',
        image_url: 'some url',
        partner_content_id: 'some ID',
        title: 'some title',
        url: 'Product-Show?pid=some ID'
    },
    order: {
        cart_value: '10000',
        coupon_code: 'coupon_code1,coupon_code2,coupon_code3',
        email: 'some email',
        first_name: 'firstName',
        last_name: 'lastName',
        partner_conversion_id: 'orderNo',
        partner_user_id: '00004'
    },
    category: {
        category_url: 'Search-Show?cgid=some ID',
        image_url: 'some url',
        title: 'some title'
    }
};

describe('Add the attribute to the object from sytem object', () => {
    it('should no add a fiels if attributes empty', () => {
        var object = {};
        addAttributes(object, source, null, true);
        assert.deepEqual(object, {});

        addAttributes(object, source, '', true);
        assert.deepEqual(object, {});
    });

    it('should add Customer fiels to the object (owerwrite value)', () => {
        var object = {
            key: 'value',
            first_name: 'value',
            last_name: 'value'
        };
        var config = {
            first_name: 'customer.profile.firstName',
            last_name: 'customer.profile.lastName',
            email: 'customer.profile.email',
            partner_user_id: 'customer.$customerId'
        };
        addAttributes(object, source, config, true);
        assert.deepEqual(object, modelObj.customer);
    });

    it('should add Customer fiels to the object (append fiels) ', () => {
        var object = {
            key: 'value',
            first_name: 'value',
            last_name: 'value'
        };
        var config = {
            first_name: 'customer.profile.firstName',
            last_name: 'customer.profile.lastName',
            email: 'customer.profile.email',
            partner_user_id: 'customer.$customerId'
        };
        var result = {
            email: 'some email',
            first_name: 'value',
            key: 'value',
            last_name: 'value',
            partner_user_id: '000004'
        };
        addAttributes(object, source, config, false);
        assert.deepEqual(object, result);
    });

    it('should add Product fiels to the object', () => {
        var object = {};
        var config = {
            title: 'product.$productTitle',
            image_url: 'product.$productImageURL',
            description: 'product.pageDescription',
            url: 'product.$productURL',
            partner_content_id: 'product.ID'
        };
        addAttributes(object, source, config, true);
        assert.deepEqual(object, modelObj.product);
    });

    it('should add Order fiels to the object', () => {
        var object = {};
        var config = {
            partner_conversion_id: 'order.orderNo',
            cart_value: 'order.$cartValue',
            coupon_code: 'order.$couponList',
            first_name: 'order.billingAddress.firstName',
            last_name: 'order.billingAddress.lastName',
            email: 'order.customerEmail',
            partner_user_id: 'order.customerNo'
        };
        addAttributes(object, source, config, true);
        assert.deepEqual(object, modelObj.order);
    });

    it('should add Category fiels to the object', () => {
        var object = {};
        var config = {
            category_url: 'category.$categoryURL',
            image_url: 'category.$categoryImageURL',
            title: 'category.$categoryTitle'
        };
        addAttributes(object, source, config, true);
        assert.deepEqual(object, modelObj.category);
    });
});
