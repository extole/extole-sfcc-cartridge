'use strict';

var Site = require('dw/system/Site');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var logger = Logger.getLogger('ExtoleProcessOrders');

/**
 * Returns orders older then setup window and not yet sent to Extole
 * @returns {Array} ordersRes - order filtered out by date
 */
function getOrdersPassedReturnWindow() {
    var ordersRes = [];

    try {
        var orders = [];
        var ordersReturnWindow = Site.getCurrent().getCustomPreferenceValue('extoleOrdersReturnWindow');

        // Determine how far back to go from site preference
        var orderExpirationDays = parseInt(ordersReturnWindow || 0, 10);

        var date = new Date();
        date.setHours(date.getHours() - (orderExpirationDays * 24));

        // Get all orders older than orderExpirationDays
        orders = OrderMgr.searchOrders('creationDate <= {0}', null, date);

        // Iterate over Orders
        while (orders.hasNext()) {
            var order = orders.next();

            if (!order.custom.extoleApproveSentStatus) {
                ordersRes.push(order);
            }
        }
        orders.close();
    } catch (e) {
        logger.error(e);
    }

    return ordersRes;
}

/**
 * Returns object with parameters need to be send to Extole for certain order
 * @param {order} order - order to process
 * @returns {Object} res - result object
 */
function prepareApproveCallParams(order) {
    var approveStatus = '';
    var note = '';
    var res = {};

    if (order.status.value === Order.ORDER_STATUS_COMPLETED) {
        approveStatus = 'approve';
        note = 'Order was confirmed';
    } else if ((order.status.value === Order.ORDER_STATUS_CANCELLED) || (order.status.value === Order.ORDER_STATUS_FAILED)) {
        approveStatus = 'decline';
        note = 'Order was failed or canceled';
    }

    res = {
        orderNo: order.getOrderNo(),
        approveStatus: approveStatus,
        note: note
    };

    return res;
}

/**
 *    Execute the request on the service configuration
 *
 *    @param {dw.svc.Seervice} service - the service configuration object
 *    @param {Object} params - service call parameters
 *    @returns {dw.svc.Result} result - the http result object.
 */
function makeCall(service, params) {
    var httpParameterMap = request.httpParameterMap; // eslint-disable-line
    var counter = (httpParameterMap && httpParameterMap.numCalls) ? httpParameterMap.numCalls.stringValue : null;
    var mockCall = false;
    var result = {};

    if (counter == null) {
        counter = 1;
    }

    while (counter !== 0) {
        if (mockCall) {
            result = service.setMock().call(params);
        } else {
            result = service.call(params);
        }
        counter -= 1;
    }

    return result;
}

/**
 *    Makes API approval call to the Extole service to update order status
 *    @param {Object} orderData - object with the order data
 *    @returns {void}
 */
function extoleOrderReservationServiceCall(orderData) {
    var orderNo = orderData.orderNo;
    var approveStatus = orderData.approveStatus;
    var note = orderData.note;
    var requestBody = {};
    var resultObj = {};
    var accessToken = Site.getCurrent().getCustomPreferenceValue('extoleAccessToken');

    Transaction.wrap(function () {
        var extoleServiceHelper = require('~/cartridge/scripts/services/extoleHttpServiceInit.js');
        var service = extoleServiceHelper.getService();

        service.addParam('access_token', accessToken)
            .addParam('partner_conversion_id', orderNo)
            .addParam('event_status', approveStatus)
            .addParam('note', note);

        // Make the service call here
        var result = makeCall(service, requestBody);

        if (result == null || service == null) {
            return;
        }

        resultObj = JSON.parse(result.object);

        // update order if approve or decline was successfully made
        if (resultObj.status === 'success' || resultObj.status === 'failure') {
            var order = OrderMgr.getOrder(orderNo);
            order.custom.extoleApproveSentStatus = true;
            logger.info('Processed order #' + orderData.orderNo + ', update status - ' + resultObj.status);
        }
    });
}

/**
 *    UpdateOrderStatus
 */
function UpdateOrderStatus() {
    var approvalAPIEnabled = Site.getCurrent().getCustomPreferenceValue('extoleActivateApprovalAPI');
    if (approvalAPIEnabled) {
        var orders = getOrdersPassedReturnWindow();

        for (var i = 0; i < orders.length; i += 1) {
            var order = orders[i];
            var orderData = prepareApproveCallParams(order);
            extoleOrderReservationServiceCall(orderData);
        }

        logger.info('Total amount of processed orders - ' + orders.length);
    }
}

module.exports = { UpdateOrderStatus: UpdateOrderStatus };
