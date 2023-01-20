'use strict';

var URLUtils = require('dw/web/URLUtils');
var logger = require('*/cartridge/scripts/extole/extoleLogger').getLogger('extole.tag.attribute');

var agregatedValueHandlers = {
    $customerId: function name(customer) {
        if (typeof customer !== 'object' || customer.constructor.name !== 'dw.customer.Customer') { return null; }
        var customerProfile = customer ? customer.getProfile() : null;
        return customerProfile ? customerProfile.getCustomerNo() : customer.ID;
    },
    $productTitle: function name(product) {
        if (typeof product !== 'object'
            || (product.constructor.name !== 'dw.catalog.Product' && product.constructor.name !== 'dw.catalog.Variant')) { return null; }
        return !empty(product.getName()) ? product.getName() : product.ID;
    },

    $productImageURL: function (product) {
        if (typeof product !== 'object'
            || (product.constructor.name !== 'dw.catalog.Product' && product.constructor.name !== 'dw.catalog.Variant')) { return null; }
        return !empty(product.getImage('small')) ? product.getImage('small').getAbsURL().toString() : '';
    },

    $productURL: function (product) {
        if (typeof product !== 'object'
            || (product.constructor.name !== 'dw.catalog.Product' && product.constructor.name !== 'dw.catalog.Variant')) { return null; }
        return URLUtils.http('Product-Show', 'pid', product.ID).toString();
    },

    $cartValue: function (order) {
        if (typeof order !== 'object' || order.constructor.name !== 'dw.order.Order') { return null; }
        return order.getAdjustedMerchandizeTotalPrice(false).add(order.giftCertificateTotalPrice).getDecimalValue().toString();
    },

    $couponList: function (order) {
        if (typeof order !== 'object' || order.constructor.name !== 'dw.order.Order') { return null; }
        var clis = order.getCouponLineItems();
        var couponArr = [];
        for (var i = 0; i < clis.length; i += 1) {
            couponArr.push(clis[i].getCouponCode());
        }
        return couponArr.join(',');
    },

    $orderCustomerId: function (order) {
        if (typeof order !== 'object' || order.constructor.name !== 'dw.order.Order') { return null; }
        return order.customerNo || order.customer.ID;
    },

    $categoryTitle: function (category) {
        if (typeof category !== 'object' || category.constructor.name !== 'dw.catalog.Category') { return null; }
        return !empty(category.getDisplayName()) ? category.getDisplayName() : category.ID;
    },

    $categoryImageURL: function (category) {
        if (typeof category !== 'object' || category.constructor.name !== 'dw.catalog.Category') { return null; }
        return !empty(category.getImage()) ? category.getImage().getAbsURL().toString() : '';
    },

    $categoryURL: function (category) {
        if (typeof category !== 'object' || category.constructor.name !== 'dw.catalog.Category') { return null; }
        return URLUtils.http('Search-Show', 'cgid', category.ID).toString();
    }
};

/**
 * Function get value of SFCC objects property by attribute name.
 * An attribute name can be complex and consist of several levels.
 * Attribute names must be separated by dots.
 * Examle: primaryCategory.ID
 * @param {Object} sources - object of SFCC objects
 * @param {string} fullAttributeName - attribute name of SFCC object like 'customer.profile.firstName'
 * @returns {string|boolean|number|null} - value
 */
function getAttributeValue(sources, fullAttributeName) {
    var productAttributeArr = fullAttributeName.split('.');
    var object = sources[productAttributeArr[0]];
    var attributeName = productAttributeArr[1];
    return agregatedValueHandlers[attributeName]
        ? agregatedValueHandlers[attributeName](object)
        : productAttributeArr
            .slice(1)
            .reduce(function (previousValue, currentProperty) {
                if (previousValue && Object.hasOwnProperty.call(previousValue, currentProperty)) {
                    return previousValue[currentProperty];
                }
                logger.warn('Non-existent object property: {0}', fullAttributeName);
                return null;
            }, object);
}

/**
 * Futction added SFCC System Objects attributes to the Extole data object
 * @param {Object} object - ZoneTag Model Object
 * @param {Object} sources - object of SFCC objects
 * @param {Object} attributes - object with object attributes to be added to the tag where:
 *    'key' - ZoneTag attributes name,
 *    'value' - full name of the SFCC object attribute separated by dots, like 'customer.profile.firstName'
 * @param {boolean} owerwrite - owerwrite value if exist
 */
module.exports = function addAttributes(object, sources, attributes, owerwrite) {
    var self = object;
    if (sources && attributes) {
        var keys = Object.keys(attributes);
        for (let i = 0; i < keys.length; i++) {
            let attributeName = keys[i];
            if (owerwrite || empty(self[attributeName])) {
                let value = getAttributeValue(sources, attributes[attributeName]);
                if (value) self[attributeName] = value;
            }
        }
    }
};
