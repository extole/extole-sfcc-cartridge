'use strict';

var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');

/**
 * Remote include endpoint to render Extole zone tag template
 */
function zonetag() {
    var OrderMgr = require('dw/order/OrderMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var CatalogMgr = require('dw/catalog/CatalogMgr');

    // eslint-disable-next-line no-undef
    var params = request.httpParameterMap;
    var extoleData = {
        name: params.name.value,
        element_id: params.elementId.value,
        predefinedData: params.predefined_data.value,
        mappedData: params.mapped_data.value,
        data: params.data.value,
        jwt: params.jwt.value,
        customer: customer, // eslint-disable-line no-undef
        product: params.productId.value ? ProductMgr.getProduct(params.productId.value) : null,
        category_obj: params.categoryId.value ? CatalogMgr.getCategory(params.categoryId.value) : null,
        order_obj: params.orderId.value ? OrderMgr.getOrder(params.orderId.value, params.orderToken.value) : null
    };

    app.getView(extoleData).render('extole/zonetag');
}

exports.Zonetag = guard.ensure(['get', 'include'], zonetag);
