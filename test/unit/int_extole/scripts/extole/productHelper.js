'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Collection = require('../../../../mocks/dw.util.Collection');

var variationModel = {
    getProductVariationAttributes: function () {
        return new Collection([
            {
                attributeID: 'size',
                getAttributeID: () => 'size'
            },
            {
                attributeID: 'color',
                getAttributeID: () => 'color'
            }
        ]);
    },
    getSelectedValue: function (variationAttr) {
        if (variationAttr.attributeID === 'size') {
            return { displayValue: 'S' };
        } else if (variationAttr.attributeID === 'color') {
            return { displayValue: 'white' };
        }
        return null;
    },
    getAllValues: function (variationAttr) {
        if (variationAttr.attributeID === 'size') {
            return new Collection([
                { displayValue: 'S' },
                { displayValue: 'M' },
                { displayValue: 'L' }
            ]);
        } else if (variationAttr.attributeID === 'color') {
            return new Collection([
                { displayValue: 'blue' },
                { displayValue: 'white' }
            ]);
        }
        return new Collection([]);
    },
    hasOrderableVariants: function () { return false; }
};

var product = {
    masterProduct: {
        variationModel: variationModel
    },
    variationModel: variationModel,
    getVariationModel: function () {
        return variationModel;
    },
    isVariant: function () { return true; },
    isMaster: function () { return true; }
};

var ProductMgr = {
    getProduct: () => product
};

var libExtole = {
    isOnlineVariations: () => false
};

var productHelper = proxyquire('../../../../../cartridges/int_extole/cartridge/scripts/extole/productHelper.js', {
    'dw/catalog/ProductMgr': ProductMgr,
    '*/cartridge/scripts/extole/libExtole': libExtole
});

describe('Add the attribute to the object from the string', () => {
    before(function () {
    });

    it('should add a fiels with product variation attributes', () => {
        var object = {};
        var result = {
            content: {
                color: 'white',
                size: 'S'
            },
            product_variants: '[{"name":"size","values":["S","M","L"]},{"name":"color","values":["blue","white"]}]'
        };
        var selectedAttr = productHelper.getDefaultAttributes(object, product, null);
        assert.deepEqual(object, result);
        assert.deepEqual(selectedAttr, { size: 'S', color: 'white' });
    });
});
