'use strict';

/**
 * Function fixed data attributes to the Extole data object
 * @param {Object} object - Extole data object
 * @param {string} data - fixed data attributes
 *    attribute string format: 'attr_name1: value1, attr_name2: value2, ...'
 * @param {boolean} owerwrite - owerwrite value if exist
 */
module.exports = function addData(object, data, owerwrite) {
    var self = object;
    if (data) {
        data
            .split(',')
            .forEach(function (element) {
                let separateIndex = element.indexOf(':');
                if (separateIndex !== -1) {
                    let attrName = element.slice(0, separateIndex).trim();
                    let value = element.slice(separateIndex + 1).trim();
                    if (attrName && value && (owerwrite || empty(self[attrName]))) {
                        self[attrName] = value;
                    }
                }
            });
    }
};
