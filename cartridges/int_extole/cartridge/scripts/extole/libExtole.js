'use strict';

/**
*     libExtole.js
*
*    This file is a library file for the Extole integration.
*    All helper/util functions are dedicated into libExtole.ds file.
*
*/

var Site = require('dw/system/Site');

var ExtoleSettings = {
    isExtoleEnabled: function () {
        return !!Site.getCurrent().getCustomPreferenceValue('extoleActivated');
    },

    isApprovalAPIEnabled: function () {
        return !!Site.getCurrent().getCustomPreferenceValue('extoleActivateApprovalAPI');
    },

    getSiteLabel: function () {
        return Site.getCurrent().getCustomPreferenceValue('extoleSiteLabel');
    },

    getScriptUrl: function () {
        return Site.getCurrent().getCustomPreferenceValue('extoleCoreUrl');
    },

    getKeyIdentifier: function () {
        return Site.getCurrent().getCustomPreferenceValue('extoleTokenKeyIdentifier');
    },

    getSecretKey: function () {
        return Site.getCurrent().getCustomPreferenceValue('extoleTokenSecretKey');
    },

    isOnlineVariations: function () {
        return !!Site.getCurrent().getCustomPreferenceValue('extoleOnlineVariationsAttr');
    }
};

module.exports = ExtoleSettings;
