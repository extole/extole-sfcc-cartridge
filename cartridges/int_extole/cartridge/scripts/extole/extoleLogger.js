'use strict';

/**
 * Module for logging Extole parse error
 */
var Logger = require('dw/system/Logger');
const EXTOLE_LOG_NAME = 'Extole';

module.exports = {
    getLogger: function (loggingCategory) { return Logger.getLogger(EXTOLE_LOG_NAME, loggingCategory); }
};
