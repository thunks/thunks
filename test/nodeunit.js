'use strict';
/*global module, process, Promise, noneFn*/

var thunks = require('../thunks.js'),
  x = {};

exports.thunk1 = function (test) {
  // 测试 thunk 组合
  var Thunk = thunks();
  var thunk1 = Thunk(1);
  var thunk2 = thunk1(function (error, value) {
    test.strictEqual(error, null);
    test.strictEqual(value, 1);
    return 2;
  });
  var thunk3 = thunk2(function (error, value) {
    test.strictEqual(error, null);
    test.strictEqual(value, 2);
    return Thunk(function (callback) {
      setImmediate(function () {
        callback(null, x);
      });
    });
  });
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
    return Thunk.all([]);
  })(function (error, value) {
    test.deepEqual(value, []);
    return Thunk.all([1, 2, 3, 4, 5]);
  })(function (error, value) {
    test.deepEqual(value, [1, 2, 3, 4, 5]);
    return Thunk.all([
      0,
      Thunk(1),
      Thunk(Thunk(2)),
      Thunk(function (callback) {
        setImmediate(function () { callback(null, 3); });
      }),
      Thunk(Thunk(function (callback) {
        setImmediate(function () { callback(null, 4); });
      })),
      [5]
    ]);
  })(function (error, value) {
    test.deepEqual(value, [0, 1, 2, 3, 4, [5]]);
    return Thunk.all([
      0,
      Thunk(1),
      Thunk(Thunk(2)),
      Thunk(function (callback) {
        setImmediate(function () { callback(null, 3); });
      }),
      Thunk(function (callback) {
        noneFn();
      }),
      [5]
    ])(function (error, value) {
      test.strictEqual(error instanceof Error, true);
      test.strictEqual(value, undefined);
      return Thunk.all(1);
    })(function (error, value) {
      test.strictEqual(error instanceof Error, true);
      test.strictEqual(value, undefined);
      return Thunk.all(x);
    });
  })(function (error, value) {
    test.notStrictEqual(value, x);
    test.deepEqual(value, {});
    return Thunk.all({a: 1, b: 2, c: 3, d: 4, e: [5]});
  })(function (error, value) {
    test.deepEqual(value, {a: 1, b: 2, c: 3, d: 4, e: [5]});
    return Thunk.all({
      a: 1,
      b: Thunk(2),
      c:  typeof Promise === 'function'? Promise.resolve(3) : 3,
      d: Thunk(function (callback) {
        setImmediate(function () { callback(null, 4); });
      }),
      e: [5]
    });
  })(function (error, value) {
    test.deepEqual(value, {a: 1, b: 2, c: 3, d: 4, e: [5]});
    return Thunk.all({
      a: 1,
      b: Thunk(2),
      c: Thunk(Thunk(3)),
      d: Thunk(function (callback) {
        noneFn();
      }),
      e: [5]
    })(function (error, value) {
      test.strictEqual(error instanceof Error, true);
      test.strictEqual(value, undefined);
    });
  })(function (error, value) {
    if (typeof Promise === 'function') {
      return Thunk(Promise.resolve(1))(function (error, value) {
        test.strictEqual(error, null);
        test.strictEqual(value, 1);
        return Thunk(Promise.reject(false));
      })(function (error, value) {
        test.strictEqual(error, false);
        test.strictEqual(value, undefined);
        var promise = new Promise(function (resolve, rejecct) {
          setImmediate(function () { resolve(x); });
        });
        return promise;
      })(function (error, value) {
        test.strictEqual(value, x);
        return 'TEST SUCCESS!';
      });
    } else {
      return 'TEST SUCCESS!';
    }
  })(function (error, value) {
    test.strictEqual(value, 'TEST SUCCESS!');
    return Thunk.call({x: x}, function (callback) {
      test.strictEqual(this.x, x);
      callback();
    })(function (error, value) {
      test.strictEqual(error, null);
      test.strictEqual(value, undefined);
      test.strictEqual(this.x, x);
      return this.x;
    })(function (error, value) {
      test.strictEqual(error, null);
      test.strictEqual(value, x);
      test.strictEqual(this.x, x);
      return Thunk(1)(function (error, value) {
        test.strictEqual(error, null);
        test.strictEqual(value, 1);
        test.strictEqual(this, null);
        return x;
      });
    });
  })(function (error, value) {
    test.strictEqual(value, x);
    return Thunk.all.call({x: x}, [1, 2, 3, 4, 5])(function (error, value) {
      test.strictEqual(error, null);
      test.deepEqual(value, [1, 2, 3, 4, 5]);
      test.strictEqual(this.x, x);
      return Thunk(x)(function (error, value) {
        test.strictEqual(error, null);
        test.strictEqual(value, x);
        test.strictEqual(this, null);
        return x;
      });
    });
  })(function (error, value) {
    test.strictEqual(value, x);
    return Thunk.digest(1, 2);
  })(function (error, value) {
    test.strictEqual(error, 1);
    test.strictEqual(value, undefined);
    return Thunk.digest(null, 1, 2, 3);
  })(function (error, value1, value2, value3) {
    test.strictEqual(error, null);
    test.strictEqual(value1, 1);
    test.strictEqual(value2, 2);
    test.strictEqual(value3, 3);
    return Thunk.digest.call({x: x}, null, x)(function (error, value) {
      test.strictEqual(error, null);
      test.strictEqual(value, x);
      test.strictEqual(this.x, x);
      return x;
    });
  })(function (error, value) {
    test.strictEqual(value, x);
    test.done();
  });
};
exports.thunk2 = function (test) {
  // 测试 thunk 作用域内的 debug 模式和异常处理
  test.notStrictEqual(thunks(), thunks());
  var Thunk = thunks();
  Thunk()(function (error) {
    var _error, e = {};
    var thunk1 = thunks(function (error) {
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
    var thunk1 = thunks({
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
    return Thunk(function (callback) {
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
