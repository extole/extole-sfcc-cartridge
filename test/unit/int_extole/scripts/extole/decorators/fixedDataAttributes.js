'use strict';

var assert = require('chai').assert;

var fixedDataAttributes = require('../../../../../../cartridges/int_extole/cartridge/scripts/extole/decorators/fixedDataAttributes.js');

var { empty } = require('../../../../../mocks/global');
global.empty = empty;

describe('Add the attribute to the object from the string', () => {
    var data = 'key_one: value_one, key_two: value_two';

    it('should no add a fiels from empty string', () => {
        var object = {};
        fixedDataAttributes(object, null, true);
        assert.deepEqual(object, {});

        fixedDataAttributes(object, '', true);
        assert.deepEqual(object, {});
    });

    it('should add fiels to the object from string', () => {
        var object = {
            key: 'value'
        };
        var result = {
            key: 'value',
            key_one: 'value_one',
            key_two: 'value_two'
        };
        fixedDataAttributes(object, data, true);
        assert.deepEqual(object, result);
    });

    it('only missing fields should be added to the object from the string', () => {
        var object = {
            key_one: 'value'
        };
        var result = {
            key_one: 'value',
            key_two: 'value_two'
        };
        fixedDataAttributes(object, data, false);
        assert.deepEqual(object, result);
    });

    it('should owerwrite existing object fields value from the string', () => {
        var object = {
            key_one: 'value'
        };
        var result = {
            key_one: 'value_one',
            key_two: 'value_two'
        };
        fixedDataAttributes(object, data, true);
        assert.deepEqual(object, result);
    });
});
