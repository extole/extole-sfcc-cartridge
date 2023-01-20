'use strict';

/* API Includes */
var Site = require('dw/system/Site');
var Mac = require('dw/crypto/Mac');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');

var addProductDefaultAttributes = require('*/cartridge/scripts/extole/decorators/productDefaultAttributes');
var addProductCustomAttributes = require('*/cartridge/scripts/extole/decorators/productCustomAttributes');
var extoleConfigurations = require('*/cartridge/scripts/extole/libExtole');
var addAttributes = require('*/cartridge/scripts/extole/decorators/systemObjectAttributes');
var addFixedData = require('*/cartridge/scripts/extole/decorators/fixedDataAttributes');
var { getTagConfig } = require('*/cartridge/scripts/extole/configHelper');

/**
 * @description Encodes a string into URL Base64 safe
 * @param {string | dw.util.Bytes} input - data to Encode
 * @returns {string} - encoded Base64 URL safe string
 */
function urlsafeB64Encode(input) {
    var bt = typeof input === 'string' ? new Bytes(input) : input;
    return Encoding.toBase64(bt).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * @description Computes the signature for the TurnTo Request
 * @param {Object} header - header of JWT token
 * @param {Object} payload - payload of JWT token
 * @param {string} secretKey - key for compute signature
 * @returns {string} - JWT token
 */
function computeJwtToken(header, payload, secretKey) {
    if (!secretKey) return null;
    var headerStr = JSON.stringify(header);
    var objStr = JSON.stringify(payload);
    var unsignedToken = urlsafeB64Encode(headerStr) + '.' + urlsafeB64Encode(objStr);

    var mac = new Mac(Mac.HMAC_SHA_256);
    var signature = urlsafeB64Encode(mac.digest(unsignedToken, secretKey));
    var jwt = unsignedToken + '.' + signature;
    return jwt;
}

/**
 * Geterate JWT token
 * @param {Object} payloadData - JWY tokrn payload data
 * @returns {string} - JWT token
 */
function getJwtToken(payloadData) {
    if (!payloadData) return null;

    var payload = payloadData;
    var header = {
        alg: 'HS256',
        typ: 'JWT',
        kid: extoleConfigurations.getKeyIdentifier()
    };

    // Added token lifetime
    var issuedAt = Math.floor((Date.now() / 1000));
    payload.exp = (issuedAt + 300).toFixed(0);
    payload.nbf = (issuedAt - 60).toFixed(0);
    payload.iat = issuedAt.toFixed(0);

    return computeJwtToken(header, payload, extoleConfigurations.getSecretKey());
}

/**
 * Function returns Extole Zone Tag object build based on pdict data, where
 * name         : zone name
 * element_id   : zone element_id
 * customer     : active customer info, when available
 * order_obj    : order object, when available
 * product      : product object, when available
 * category_obj : category object, when available
 * labels       : Site ID and Current Locale
 *
 * @param {Object} pdict - pipeline pdict or controller result object
 * @returns {Object} extoleZoneTag - configured extoleZoneTag object
 */
function getExtoleZoneTag(pdict) {
    var extole = extoleConfigurations;
    var isExtoleEnabled = extole.isExtoleEnabled();
    var name = pdict.name.toString();

    // Label related data
    var siteName = (extole.getSiteLabel()) ? extole.getSiteLabel() : 'Sites-' + Site.current.name + '-Site';
    var currentLocale = pdict.CurrentRequest.locale;

    // creating Extole Zone Tag object
    var extoleZoneTag = {};
    if (!(isExtoleEnabled && name)) {
        return extoleZoneTag;
    }
    // name
    extoleZoneTag.name = name;

    // element_id
    if (pdict.element_id) {
        extoleZoneTag.element_id = pdict.element_id;
    }

    // data object
    extoleZoneTag.data = {
        // labels
        labels: [siteName, currentLocale]
    };

    // environment type
    if (dw.system.System.getInstanceType() !== dw.system.System.PRODUCTION_SYSTEM) {
        extoleZoneTag.data.sandbox = 'production-qa';
    }

    var tagConfig = getTagConfig(pdict.predefinedData, pdict.mappedData, pdict.jwt);
    var souceObjects = {};
    if (pdict.customer) { souceObjects.customer = pdict.customer; }
    if (pdict.product) { souceObjects.product = pdict.product; }
    if (pdict.category_obj) { souceObjects.category = pdict.category_obj; }
    if (pdict.order_obj) { souceObjects.order = pdict.order_obj; }

    if (tagConfig) {
        Object.keys(tagConfig).forEach(function (key) {
            switch (key) {
                case 'customer':
                    addAttributes(extoleZoneTag.data, souceObjects, tagConfig[key], false);
                    break;
                case 'product':
                    if (!Object.hasOwnProperty.call(extoleZoneTag.data, 'content')) { extoleZoneTag.data.content = {}; }
                    addAttributes(extoleZoneTag.data.content, souceObjects, tagConfig[key], true);
                    if (pdict.product) {
                        addProductDefaultAttributes(extoleZoneTag.data, pdict.product);
                        addProductCustomAttributes(extoleZoneTag.data, pdict.product);
                    }
                    break;
                case 'category':
                    if (!Object.hasOwnProperty.call(extoleZoneTag.data, 'content')) { extoleZoneTag.data.content = {}; }
                    addAttributes(extoleZoneTag.data.content, souceObjects, tagConfig[key], true);
                    break;
                case 'order':
                    addAttributes(extoleZoneTag.data, souceObjects, tagConfig[key], true);
                    break;
                case 'jwt':
                    var payload = {};
                    addAttributes(payload, souceObjects, tagConfig[key], true);
                    var jwtToken = getJwtToken(payload);
                    if (jwtToken) extoleZoneTag.jwt = jwtToken;
                    break;
                default:
                    break;
            }
        });
    }

    if (pdict.data) {
        addFixedData(extoleZoneTag.data, pdict.data, true);
    }

    return extoleZoneTag;
}

module.exports = {
    get: getExtoleZoneTag
};
