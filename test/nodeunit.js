'use strict';
/*global module, process*/

var Thunk = require('../thunk.js'),
  x = {};

exports.thunk1 = function (test) {
  // 测试 thunk 组合
  var thunk = Thunk();
  var thunk1 = thunk(1);
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
    return thunk(function (callback) {
      setImmediate(function () {
        callback(null, x);
      });
    });
  });
  test.strictEqual(thunk3._isThunk, true);
  thunk3(function (error, value) {
    test.strictEqual(error, null);
    test.strictEqual(value, x);
    return thunk(function (callback) {
      setImmediate(function () {
        callback(false, true);
      });
    });
  })(function (error, value) {
    test.strictEqual(error, false);
    test.strictEqual(value, undefined);
    return thunk(function (callback) {
      callback(null, 1, 2, 3, x);
    });
  })(function (error, value1, value2, value3, value4) {

    test.strictEqual(error, null);
    test.strictEqual(value1, 1);
    test.strictEqual(value2, 2);
    test.strictEqual(value3, 3);
    test.strictEqual(value4, x);
    return thunk(function (callback) {
      setImmediate(function () {callback(null, 1);});
    })(function (error, value) {
      test.strictEqual(value, 1);
      return value * 2;
    })(function (error, value) {
      test.strictEqual(value, 2);
      return thunk(function (callback) {
        setImmediate(function () {callback(null, value * 2);});
      });
    })(function (error, value) {
      test.strictEqual(value, 4);
      return value * 2;
    });
  })(function (error, value) {
    test.strictEqual(value, 8);
    return thunk(thunk(value * 2));
  })(function (error, value) {
    test.strictEqual(value, 16);
    return thunk.all([
      0,
      thunk(1),
      thunk(thunk(2)),
      thunk(function (callback) {
        setImmediate(function () { callback(null, 3); });
      }),
      thunk(thunk(function (callback) {
        setImmediate(function () { callback(null, 4); });
      })),
      [5]
    ]);
  })(function (error, value) {
    test.deepEqual(value, [0, 1, 2, 3, 4, [5]]);
    test.done();
  });
};
exports.thunk2 = function (test) {
  // 测试 thunk 作用域内的 debug 模式和异常处理
  test.notStrictEqual(Thunk(), Thunk());
  var thunk = Thunk();
  thunk()(function (error) {
    var _error, e = {};
    var thunk1 = Thunk(function (error) {
      _error = error;
    });
    thunk1(function (callback) {
      callback(e);
    })(function (error) {
      test.ok(false);
    });
    test.strictEqual(_error, e);
    return;
  })(function (error) {
    test.strictEqual(error, null);
    test.strictEqual(arguments.length, 1);
    var _error, _debug, e = {};
    var thunk1 = Thunk({
      onerror: function (error) {
        _error = error;
      },
      debug: function () {
        _debug = arguments;
      }
    });
    thunk1(function (callback) {
      callback(null, 1, e);
    })(function (error) {
      test.strictEqual(_debug[0], null);
      test.strictEqual(_debug[1], 1);
      test.strictEqual(_debug[2], e);
      return thunk1(function (callback) {
        callback(e, e);
      });
    })(function (error) {
      test.ok(false);
    });
    test.strictEqual(_error, e);
    test.strictEqual(_debug[0], e);
    test.strictEqual(_debug.length, 2);
    return thunk(function (callback) {
      callback(1, 2, 3);
    });
  })(function (error) {
    test.strictEqual(error, 1);
    test.strictEqual(arguments.length, 1);
    throw new Error('error!');
  })(function (error, value) {
    test.strictEqual(value, undefined);
    test.ok(error instanceof Error);
    test.strictEqual(error.message, 'error!');
    test.done();
  });
};
