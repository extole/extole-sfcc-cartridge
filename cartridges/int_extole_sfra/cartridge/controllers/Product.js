'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Variation', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var { getSelectedVatiantAttributes } = require('*/cartridge/scripts/extole/productHelper');
    var viewData = res.getViewData();

    if (viewData.product && viewData.product.id) {
        var product = ProductMgr.getProduct(viewData.product.id);
        viewData.extoleVariationAttr = getSelectedVatiantAttributes(product, req.querystring);
    }

    res.setViewData(viewData);
    return next();
});

module.exports = server.exports();
