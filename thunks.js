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

  var maxTickDepth = 100, toString = Object.prototype.toString;
  var isArray = Array.isArray || function (obj) {
    return toString.call(obj) === '[object Array]';
  };
  var nextTick = typeof setImmediate === 'function' ? setImmediate : function (fn) {
    setTimeout(fn, 0);
  };

  function isObject(obj) {
    return obj && obj.constructor === Object;
  }

  function isFunction(fn) {
    return typeof fn === 'function';
  }

  function isGenerator(obj) {
    return isFunction(obj.next) && isFunction(obj.throw);
  }

  function isGeneratorFunction(obj) {
    return obj && obj.constructor && obj.constructor.name === 'GeneratorFunction';
  }

  function noOp(error) {
    if (error == null) return;
    nextTick(function () {
      throw error;
    });
  }

  // fast slice for `arguments`.
  function slice(args, start) {
    start = start || 0;
    if (start >= args.length) return [];
    var len = args.length, ret = Array(len - start);
    while (len-- > start) ret[len - start] = args[len];
    return ret;
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

  function toThunk(obj, thunkObj) {
    if (!obj || isFunction(obj)) return obj;
    if (isGenerator(obj)) obj = generatorToThunk(obj);
    else if (isFunction(obj.toThunk)) obj = obj.toThunk();
    else if (isFunction(obj.then)) obj = promiseToThunk(obj);
    else if (thunkObj && (isArray(obj) || isObject(obj))) obj = objectToThunk(obj);
    return obj;
  }

  function endThunk(ctx, value, callback) {
    value = toThunk(value);
    if (!isFunction(value)) return value == null ? callback(null) : callback(null, value);
    if (isGeneratorFunction(value)) value = generatorToThunk(value.call(ctx));
    var error = tryRun(ctx, value, [callback])[0];
    return error && callback(error);
  }

  function generatorToThunk(gen) {
    return function (callback) {
      var tickDepth = maxTickDepth, ctx = this;

      function exec(fn) { // catch yield error
        try {
          fn.call(ctx, next);
        } catch (err) {
          return run(err);
        }
      }

      function run(error, res) {
        var value, ret = error == null ? gen.next(res) : gen.throw(error);
        if (ret.done) return endThunk(ctx, ret.value, callback);
        value = toThunk(ret.value, true);
        if (!isFunction(value)) return next(null, value);
        if (--tickDepth) return exec(value);

        nextTick(function () {
          tickDepth = maxTickDepth;
          exec(value);
        });
      }

      function next(error, res) {
        if (arguments.length > 2) res = slice(arguments, 1);
        try {
          run(error, res);
        } catch (err) {
          return callback(err);
        }
      }
      return next();
    };
  }

  function objectToThunk(obj) {
    return function (callback) {
      var result, pending = 1, finished = false;
      if (isArray(obj)) result = Array(obj.length);
      else if (isObject(obj)) result = {};
      else return callback(new Error('Not array or object'));

      function run(obj) {
        if (isArray(obj)) {
          for (var i = 0, l = obj.length; i < l; i++) next(obj[i], i);
        } else {
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) next(obj[key], key);
          }
        }
        if (!(--pending || finished)) return callback(null, result);
      }

      function next(fn, index) {
        if (finished) return;
        ++pending;
        fn = toThunk(fn, true);
        if (!isFunction(fn)) {
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
      }

      try {
        run(obj);
      } catch (err) {
        finished = true;
        return callback(err);
      }
    };
  }

  function sequenceToThunk(array) {
    return function (callback) {
      var i = 0, end = array.length - 1, tickDepth = maxTickDepth, result = Array(array.length);

      function run(fn) {
        fn = toThunk(fn, true);
        if (!isFunction(fn)) return next(null, fn);
        try {
          fn(next);
        } catch (err) {
          return callback(err);
        }
      }

      function next(error, res) {
        if (error != null) return callback(error);
        result[i] = arguments.length > 2 ? slice(arguments, 1) : res;
        if (++i > end) return callback(null, result);
        if (--tickDepth) return run(array[i]);
        nextTick(function () {
          tickDepth = maxTickDepth;
          run(array[i]);
        });
      }

      return end < 0 ? callback(null, result) : run(array[0]);
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
      if (scope.debug) scope.debug.apply(null, args);
      if (error == null) args[0] = null;
      else {
        args = [error];
        if (scope.onerror) {
          if (scope.onerror(error) !== true) return;
          // if onerror return true then continue
          args = [null];
        }
      }

      if (parent.callback === noOp) return noOp(args[0]);
      current.result = tryRun(parent.ctx, parent.callback, args);
      if (current.callback) return continuation(current);
      if (current.result[0] != null) nextTick(function () {
        if (current.result) noOp(current.result[0]);
      });
    }

    return result[0] != null ? callback(result[0]) : endThunk(parent.ctx, result[1], callback);
  }

  function childThunk(parent) {
    parent.next = {ctx: parent.ctx, scope: parent.scope, callback: null, result: null};
    return function (callback) {
      return child(parent, callback);
    };
  }

  function child(parent, callback) {
    parent.callback = callback || noOp;
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

    function Thunk(start) {
      var current = {ctx: this === Thunk ? null : this, scope: scope, result: [null, start]};
      return childThunk(current);
    }

    Thunk.all = function (obj) {
      if (arguments.length > 1) obj = slice(arguments);
      return Thunk.call(this, objectToThunk(obj));
    };

    Thunk.seq = function (array) {
      if (arguments.length !== 1 || !isArray(array)) array = arguments;
      return Thunk.call(this, sequenceToThunk(array));
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
        return delay > 0 ? setTimeout(callback, delay) : nextTick(callback);
      });
    };

    return Thunk;
  }

  thunks.NAME = 'thunks';
  thunks.VERSION = 'v2.2.0';
  return thunks;
}));
