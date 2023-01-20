'use strict';

var server = require('server');

server.get('Zonetag', server.middleware.include, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var CatalogMgr = require('dw/catalog/CatalogMgr');

    var params = req.querystring;
    var extoleData = {
        name: params.name,
        element_id: params.elementId,
        predefinedData: params.predefined_data,
        mappedData: params.mapped_data,
        data: params.data,
        jwt: params.jwt,
        customer: customer, // eslint-disable-line no-undef
        product: params.productId ? ProductMgr.getProduct(params.productId) : null,
        category_obj: params.categoryId ? CatalogMgr.getCategory(params.categoryId) : null,
        order_obj: params.orderId ? OrderMgr.getOrder(params.orderId, params.orderToken) : null
    };

    res.render('extole/zonetag', extoleData);
    return next();
});

module.exports = server.exports();
