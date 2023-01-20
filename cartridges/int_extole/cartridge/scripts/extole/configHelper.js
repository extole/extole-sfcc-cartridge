'use strict';

var logger = require('*/cartridge/scripts/extole/extoleLogger').getLogger('extole.tag.parser');

/**
 * Added additional properties to the configuration ZoneTag object
 * @param {Object} object - the configuration of the ZoneTag object
 * @param {string} tagData - list of additional properties
 * @param {string} customObjectName - the name of the object to add additional properties
 * @returns {void}
 */
function addConfigTagData(object, tagData, customObjectName) {
    if (tagData) {
        var result = object;
        tagData
            .replace(/[\n\r\s\t]+/g, '')
            .split(',')
            .forEach(function (element) {
                let [key, value] = element.split(':');
                if (value) {
                    let objectName = customObjectName || value.split('.')[0];
                    if (!Object.hasOwnProperty.call(result, objectName)) {
                        result[objectName] = {};
                    }
                    let obj = result[objectName];
                    obj[key] = value;
                } else {
                    logger.warn('Syntax error in ZoneTag data attribute: {0}', element);
                }
            });
    }
}

/**
 * Get the configuration of the ZoneTag object,
 * which includes the list of properties of the SFCC objects for Extole
 * @param {string} predefinedData - list of predefined objects
 * @param {string} tagData - list of additional properties
 * @param {string} jwtData - list of additional properties for the JWT token
 * @returns {Object} - the configuration of the ZoneTag object
 */
function getTagConfig(predefinedData, tagData, jwtData) {
    var tagConfig = {};
    var predefinedDataArr = [];
    // Get predefined object configuretion
    if (predefinedData) {
        tagConfig = require('*/cartridge/scripts/extole/defaultConfig.json');
        predefinedDataArr = predefinedData
            .toLowerCase()
            .replace(/[\n\r\s\t]+/g, '')
            .split(',');

        Object.keys(tagConfig).forEach(function (key) {
            if (!predefinedDataArr.includes(key)) {
                delete tagConfig[key];
            }
        });
    }

    // Add custom properties to the configuration
    addConfigTagData(tagConfig, tagData, null);

    // Add JWT custom properties to the configuration
    addConfigTagData(tagConfig, jwtData, 'jwt');

    // checking for valid objects in the configuration
    predefinedDataArr.forEach(function (key) {
        if (!Object.hasOwnProperty.call(tagConfig, key)) {
            logger.warn('Non-existent predefined objects name: {0}', key);
        }
    });

    return tagConfig;
}

module.exports = {
    getTagConfig: getTagConfig
};
