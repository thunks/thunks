// **Github:** https://github.com/teambition/thunks
//
// **License:** MIT

/* global module, define */
;(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.thunks = factory();
}(typeof window === 'object' ? window : this, function () {
  'use strict';

  var TRUE = {},
    toString = Object.prototype.toString,
    isArray = Array.isArray || function (obj) {
      return toString.call(obj) === '[object Array]';
    };

  function isFunction(fn) {
    return typeof fn === 'function';
  }

  function isThunk(fn) {
    return isFunction(fn) && fn._isThunk === TRUE;
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
    var result = {error: null, value: null};
    try {
      result.value = fn.apply(ctx, args);
    } catch (error) {
      result.error = error;
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

      var tryResult = tryRun(null, function (obj, iterator) {
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
      }]);

      if (tryResult.error) {
        finished = true;
        callback(tryResult.error);
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

  function continuation(scope, parent, isStart) {
    var result, args = parent.result, current = parent.next, onerror = scope.onerror || callback;

    function callback() {
      if (current.result === false) return;
      current.result = arguments.length ? arguments: [null];
      if (current.callback) return continuation(scope, current);
    }

    parent.result = false;
    // debug in scope
    if (scope.debug && !isStart) scope.debug.apply(null, args);
    // onerror in scope
    if (args[0] != null) {
      args = [args[0]];
      if (scope.onerror) {
        if (onerror(args[0]) !== true) return;
        // if onerror return true then continue
        args = [null];
      }
    }

    var tryResult = tryRun(parent.ctx, parent.callback, args);
    if (tryResult.error && onerror(tryResult.error) !== true) return;
    if (tryResult.value == null) return callback(null);
    result = toThunk(tryResult.value);
    if (!isThunk(result)) return callback(null, result);
    tryResult = tryRun(parent.ctx, result, [callback]);
    return tryResult.error ? onerror(tryResult.error) : null;
  }

  function thunks(options) {
    var scope = {onerror: null, debug: null};

    if (isFunction(options)) scope.onerror = options;
    else if (options) {
      if (isFunction(options.debug)) scope.debug = options.debug;
      if (isFunction(options.onerror)) scope.onerror = options.onerror;
    }

    function childThunk(parent) {
      return thunkFactory(function (callback) {
        return child(parent, callback);
      });
    }

    function child(parent, callback) {
      var current = {ctx: parent.ctx, next: null, result: null, callback: null};
      if (parent.result === false) return;
      parent.callback = callback;
      parent.next = current;
      if (parent.result) continuation(scope, parent);
      return childThunk(current);
    }

    // main function **thunk**
    function Thunk(start) {
      var current = {ctx: this === Thunk ? null : this, next: null, result: null, callback: null};

      start = toThunk(start);
      if (isThunk(start)) {
        continuation(scope, {
          ctx: current.ctx,
          next: current,
          result: [null],
          callback: function () { return start; }
        }, true);
      } else {
        current.result = start == null ? [null] : [null, start];
      }
      return childThunk(current);
    }

    Thunk.all = function (obj) {
      return Thunk.call(this, objectToThunk(obj));
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
  thunks.VERSION = 'v1.3.2';
  return thunks;
}));
