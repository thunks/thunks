// **Github:** https://github.com/teambition/thunks
//
// **License:** MIT

/* global module, define, setImmediate */
;(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.thunks = factory();
}(typeof window === 'object' ? window : this, function () {
  'use strict';

  var TRUE = {};
  var toString = Object.prototype.toString;
  var isArray = Array.isArray || function (obj) {
    return toString.call(obj) === '[object Array]';
  };
  var nextTick = typeof setImmediate === 'function' ? setImmediate : function (fn) {
    setTimeout(fn, 0);
  };

  function isFunction(fn) {
    return typeof fn === 'function';
  }

  function isThunk(fn) {
    return fn && fn._isThunk === TRUE;
  }

  function noop(error) {
    if (error != null) throw error;
  }

  // fast slice for `arguments`.
  function slice(args, start) {
    start = start || 0;
    if (start >= args.length) return [];
    var len = args.length, ret = Array(len - start);
    while (len-- > start) ret[len - start] = args[len];
    return ret;
  }

  function forEach(obj, iterator, isArray) {
    if (isArray) {
      for (var i = 0, l = obj.length; i < l; i++) iterator(obj[i], i, obj);
    } else {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) iterator(obj[key], key, obj);
      }
    }
  }

  function tryRun(ctx, fn, args) {
    var result = [null, null];
    try {
      result[1] = fn.apply(ctx, args);
    } catch (error) {
      result[0] = error;
    }
    return result;
  }

  function toThunk(obj) {
    if (!obj) return obj;
    if (isFunction(obj)) obj = thunkFactory(obj);
    else if (isFunction(obj.toThunk)) obj = thunkFactory(obj.toThunk());
    else if (isFunction(obj.then)) obj = thunkFactory(promiseToThunk(obj));
    return obj;
  }

  function thunkFactory(thunk) {
    thunk._isThunk = TRUE;
    return thunk;
  }

  function objectToThunk(obj) {
    return function (callback) {
      var result, pending = 1, finished = false, _isArray = isArray(obj);

      if (_isArray) result = Array(obj.length);
      else if (obj && typeof obj === 'object') result = {};

      if (!result) return callback(new Error('Not array or object'));

      var error = tryRun(null, function (obj, iterator) {
        forEach(obj, iterator, _isArray);
        if (!(--pending || finished)) return callback(null, result);
      }, [obj, function (fn, index) {
        if (finished) return;
        pending++;
        fn = toThunk(fn);
        if (!isThunk(fn)) {
          result[index] = fn;
          return --pending || callback(null, result);
        }
        fn(function (error, res) {
          if (finished) return;
          if (error != null) {
            finished = true;
            return callback(error);
          }
          result[index] = arguments.length > 2 ? slice(arguments, 1) : res;
          return --pending || callback(null, result);
        });
      }])[0];

      if (error) {
        finished = true;
        callback(error);
      }
    };
  }

  function promiseToThunk(promise) {
    return function (callback) {
      return promise.then(function (res) {
        callback(null, res);
      }, callback);
    };
  }

  function continuation(parent) {
    var current = parent.next, scope = parent.scope, result = parent.result;
    if (result === false) return;

    function callback(error) {
      if (parent.result === false) return;
      parent.result = false;

      var args = slice(arguments);
      // debug in scope
      if (scope.debug) scope.debug.apply(null, args);
      // onerror in scope
      if (error != null) {
        args = [error];
        if (scope.onerror) {
          if (scope.onerror(error) !== true) return;
          // if onerror return true then continue
          args = [null];
        }
      } else args[0] = null;

      if (parent.callback === noop) return noop(error);
      current.result = tryRun(parent.ctx, parent.callback, args);
      if (current.callback) return continuation(current);
      if (current.result[0] != null) nextTick(function () {
        if (current.result) noop(current.result[0]);
      });
    }

    if (result[0] != null) return callback(result[0]);

    result = toThunk(result[1]);
    if (!isThunk(result)) return result == null ? callback(null) : callback(null, result);
    var error = tryRun(parent.ctx, result, [callback])[0];
    return error && callback(error);
  }

  function childThunk(parent) {
    parent.next = {ctx: parent.ctx, scope: parent.scope, callback: null, result: null};
    return thunkFactory(function (callback) {
      return child(parent, callback);
    });
  }

  function child(parent, callback) {
    parent.callback = callback || noop;
    if (parent.result) continuation(parent);
    return childThunk(parent.next);
  }

  function thunks(options) {
    var scope = {onerror: null, debug: null};

    if (isFunction(options)) scope.onerror = options;
    else if (options) {
      if (isFunction(options.debug)) scope.debug = options.debug;
      if (isFunction(options.onerror)) scope.onerror = options.onerror;
    }

    function genSequence(value, result) {
      return function () {
        if (isArray(value)) value = objectToThunk(value);
        return Thunk(value)(function (error, value) {
          if (error) throw error;
          result.push(arguments.length > 2 ? slice(arguments, 1) : value);
        });
      };
    }

    // main function **thunk**
    function Thunk(start) {
      var current = {ctx: this === Thunk ? null : this, scope: scope, result: [null, start]};
      return childThunk(current);
    }

    Thunk.all = function (obj) {
      return Thunk.call(this, objectToThunk(obj));
    };

    Thunk.seq = function (array) {
      if (arguments.length !== 1 || !isArray(array)) array = arguments;
      return Thunk.call(this, function (callback) {
        var result = [];
        // catch error as early as possible
        var thunk = thunks(callback)();
        for (var i = 0, len = array.length; i < len; i++)
          thunk = thunk(genSequence(array[i], result));

        return thunk(function () { return result; })(callback);
      });
    };

    Thunk.digest = function () {
      var args = arguments;
      return Thunk.call(this, function (callback) {
        callback.apply(null, args);
      });
    };

    Thunk.thunkify = function (fn) {
      var ctx = this === Thunk ? null : this;
      return function () {
        var args = slice(arguments);
        return Thunk.call(ctx || this, function (callback) {
          args.push(callback);
          fn.apply(this, args);
        });
      };
    };

    Thunk.delay = function (delay) {
      return Thunk.call(this, function (callback) {
        setTimeout(callback, delay);
      });
    };

    return Thunk;
  }

  thunks.NAME = 'thunks';
  thunks.VERSION = 'v1.5.3';
  return thunks;
}));
