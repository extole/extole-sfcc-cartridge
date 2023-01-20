'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var extoleConfigurations = require('*/cartridge/scripts/extole/libExtole');

/**
 * adds default attributes (size, color, width) to the generatedAttributes object
 * @param {Object} object - Extole ZineTag data
 * @param {dw.catalog.Product} product - product object
 * @param {Object} attributes - user selected variant attributes
 * @return {Object} - user selected product variant attribute values
 */
function getDefaultAttributes(object, product, attributes) {
    var self = object;
    var variationsModel = [];
    var selectedAttributes = {};

    if (!product.isVariant() && !product.isMaster()) {
        self.product_variants = JSON.stringify(variationsModel);
        return selectedAttributes;
    }

    var productVariationModel = product.getVariationModel();
    var masterPvm = product.isVariant() ? product.masterProduct.variationModel : product.variationModel;
    var productVariationAttributes = productVariationModel.getProductVariationAttributes();
    var attrIter = productVariationAttributes.iterator();

    while (attrIter.hasNext()) {
        var productVariationAttr = attrIter.next();
        var attrId = productVariationAttr.getAttributeID();
        var productVariationAttrValue = productVariationModel.getSelectedValue(productVariationAttr);
        if (productVariationAttrValue) {
            if (!Object.hasOwnProperty.call(self, 'content')) { self.content = {}; }
            self.content[attrId] = productVariationAttrValue.displayValue;
            selectedAttributes[attrId] = productVariationAttrValue.displayValue;
        }

        var attrValuesIter = productVariationModel.getAllValues(productVariationAttr).iterator();
        var attrModel = {
            name: attrId,
            values: []
        };

        while (attrValuesIter.hasNext()) {
            var attrValue = attrValuesIter.next();
            if (!extoleConfigurations.isOnlineVariations()) {
                attrModel.values.push(attrValue.displayValue ? attrValue.displayValue : attrValue.value);
            } else if (masterPvm.hasOrderableVariants(productVariationAttr, attrValue)) {
                attrModel.values.push(attrValue.displayValue ? attrValue.displayValue : attrValue.value);
            }

            if (!selectedAttributes[attrId]
                && attributes
                && attributes[attrId]
                && attributes[attrId].value === attrValue.value) {
                selectedAttributes[attrId] = attrValue.displayValue;
            }
        }
        variationsModel.push(attrModel);
    }
    self.product_variants = JSON.stringify(variationsModel);

    return selectedAttributes;
}

/**
 * Normalizing SiteGenesis product variant attributes
 * @param {dw.system.Response} parameterMap - product variant attributes map
 * @returns {Object} - product variant attributes
*/
function getSgAttributeMap(parameterMap) {
    const formPrefix = 'dwvar_';
    let pid = parameterMap.pid.stringValue;
    let parameters = parameterMap.getParameterMap(formPrefix + pid.replace(/_/g, '__') + '_');
    let paramNames = parameters.getParameterNames();
    let result = {};
    for (let i = 0; i < paramNames.length; i++) {
        let a = paramNames[i];
        result[a] = {
            id: pid,
            value: parameters[a].value
        };
    }
    return result;
}

/**
 * Get selected product variant attributes
 * @param {dw.catalog.Product} product - product
 * @param {dw.web.HttpParameterMap} attributes - customer selected variant attributes
 * @returns {Object} - selectes variant attributes
*/
function getSgSelectedVatiantAttributes(product, attributes) {
    let pid = (attributes && attributes.pid) ? attributes.get('pid').getStringValue() : null;
    let selectedProduct = product || ProductMgr.getProduct(pid);

    if (!selectedProduct) return null;

    let attrMap = getSgAttributeMap(attributes);
    return getDefaultAttributes({}, selectedProduct, attrMap);
}

/**
 * Get selected product variant attributes
 * @param {dw.catalog.Product} product - product
 * @param {Object} attributes - customer selected variant attributes
 * @returns {Object} - selectes variant attributes
*/
function getSelectedVatiantAttributes(product, attributes) {
    return getDefaultAttributes({}, product, attributes.variables);
}

module.exports = {
    getDefaultAttributes: getDefaultAttributes,
    getSelectedVatiantAttributes: getSelectedVatiantAttributes,
    getSgSelectedVatiantAttributes: getSgSelectedVatiantAttributes
};
