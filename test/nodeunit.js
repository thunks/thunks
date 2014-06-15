'use strict';
/*global module, process*/

var Thunk = require('../thunk.js'),
  x = {};

exports.thunk = function (test) {
  var thunk1 = Thunk(1);
  test.strictEqual(thunk1._isThunk, true);
  var thunk2 = thunk1(function (error, value) {
    test.strictEqual(error, null);
    test.strictEqual(value, 1);
    return 2;
  });
  test.strictEqual(thunk2._isThunk, true);
  var thunk3 = thunk2(function (error, value) {
    test.strictEqual(error, null);
    test.strictEqual(value, 2);
    return Thunk(function (callback) {
      setImmediate(function () {
        callback(null, x);
      });
    });
  });
  test.strictEqual(thunk3._isThunk, true);
  thunk3(function (error, value) {
    test.strictEqual(error, null);
    test.strictEqual(value, x);
    return Thunk(function (callback) {
      setImmediate(function () {
        callback(false, true);
      });
    });
  })(function (error, value) {
    test.strictEqual(error, false);
    test.strictEqual(value, undefined);
    return Thunk(function (callback) {
      callback(null, 1, 2, 3, x);
    });
  })(function (error, value1, value2, value3, value4) {

    test.strictEqual(error, null);
    test.strictEqual(value1, 1);
    test.strictEqual(value2, 2);
    test.strictEqual(value3, 3);
    test.strictEqual(value4, x);
    return Thunk(function (callback) {
      setImmediate(function () {callback(null, 1);});
    })(function (error, value) {
      test.strictEqual(value, 1);
      return value * 2;
    })(function (error, value) {
      test.strictEqual(value, 2);
      return Thunk(function (callback) {
        setImmediate(function () {callback(null, value * 2);});
      });
    })(function (error, value) {
      test.strictEqual(value, 4);
      return value * 2;
    });
  })(function (error, value) {
    test.strictEqual(value, 8);
    return Thunk(Thunk(value * 2));
  })(function (error, value) {
    test.strictEqual(value, 16);
    test.done();
  });

};
