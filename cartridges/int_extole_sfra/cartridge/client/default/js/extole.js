'use strict';

$(document).ready(function () {
    $('#extole_zone_global_footer').appendTo('#extole-placeholder-footer');
});

$(document).on('click', '.extole-js-widget-view', function (e) {
    if ($(e.target).is('.extole-js-modal-overlay-view')) {
        $(document).trigger('extole-popup-close');
    }
});

$(document).on('click', '.extole-js-widget-close-button', function () {
    $(document).trigger('extole-popup-close');
});

$('#extole_zone_confirmation').on('load', function () {
    $(document).trigger('extole-popup-open');
});

var extolePopupIgnitors = [
    '.extole-content',
    '.extole-cta-image',
    '#extole-homepage-placement',
    '#extole_zone_global_footer',
    '#extole_zone_global_header',
    '#extole_zone_homepage_module',
    '#extole_zone_category',
    '#extole_zone_product',
    '#extole_zone_social'
];

$(extolePopupIgnitors.join(', ')).click(function () {
    $(document).trigger('extole-popup-open');
});

$(document).on('extole-popup-open', function () {
    $('body').addClass('extole-css-popup-open');
});

$(document).on('extole-popup-close', function () {
    $('body').removeClass('extole-css-popup-open');
});

$('body').on('extole:zoneTagUpdate', function (e, response) {
    if (window.extole) {
        window.extole.selectedProduct = response.extoleVariationAttr || {};
    }
});
