// **Github:** https://github.com/thunks/thunks
//
// **License:** MIT

/* global module, define, setImmediate */
;(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.thunks = factory();
}(typeof window === 'object' ? window : this, function() {
  'use strict';

  var maxTickDepth = 100, toString = Object.prototype.toString, hasOwnProperty = Object.prototype.hasOwnProperty;
  var isArray = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };
  var nextTick = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    setTimeout(fn, 0);
  };

  thunks.NAME = 'thunks';
  thunks.VERSION = 'v2.6.1';
  return thunks;

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
    nextTick(function() {
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

  function runThunk(ctx, value, callback, thunkObj, noTryRun) {
    value = toThunk(value, thunkObj);
    if (!isFunction(value)) return value == null ? callback(null) : callback(null, value);
    if (isGeneratorFunction(value)) value = generatorToThunk(value.call(ctx));
    if (noTryRun) return value.call(ctx, callback);
    var error = tryRun(ctx, value, [callback])[0];
    return error && callback(error);
  }

  function generatorToThunk(gen) {
    return function(callback) {
      var tickDepth = maxTickDepth, ctx = this;
      return run();

      function run(error, res) {
        var value, ret = error == null ? gen.next(res) : gen.throw(error);
        if (ret.done) return runThunk(ctx, ret.value, callback);
        if (--tickDepth) return runThunk(ctx, ret.value, next, true, true);
        nextTick(function() {
          tickDepth = maxTickDepth;
          runThunk(ctx, ret.value, next, true);
        });
      }

      function next(error, res) {
        try {
          run(error, arguments.length > 2 ? slice(arguments, 1) : res);
        } catch (err) {
          return callback(err);
        }
      }
    };
  }

  function objectToThunk(obj) {
    return function(callback) {
      var result, pending = 1, finished = false, ctx = this;
      if (isArray(obj)) {
        result = Array(obj.length);
        for (var i = 0, l = obj.length; i < l; i++) next(obj[i], i);
      } else if (isObject(obj)) {
        result = {};
        for (var key in obj) {
          if (hasOwnProperty.call(obj, key)) next(obj[key], key);
        }
      } else throw new Error('Not array or object');
      return --pending || callback(null, result);

      function next(fn, index) {
        if (finished) return;
        ++pending;
        runThunk(ctx, fn, function(error, res) {
          if (finished) return;
          if (error != null) {
            finished = true;
            return callback(error);
          }
          result[index] = arguments.length > 2 ? slice(arguments, 1) : res;
          return --pending || callback(null, result);
        }, true, true);
      }
    };
  }

  function sequenceToThunk(array) {
    return function(callback) {
      var i = 0, end = array.length - 1, tickDepth = maxTickDepth, result = Array(array.length), ctx = this;
      return end < 0 ? callback(null, result) : runThunk(ctx, array[0], next, true);

      function next(error, res) {
        if (error != null) return callback(error);
        result[i] = arguments.length > 2 ? slice(arguments, 1) : res;
        if (++i > end) return callback(null, result);
        if (--tickDepth) return runThunk(ctx, array[i], next, true);
        nextTick(function() {
          tickDepth = maxTickDepth;
          runThunk(ctx, array[i], next, true);
        });
      }
    };
  }

  function promiseToThunk(promise) {
    return function(callback) {
      return promise.then(function(res) {
        callback(null, res);
      }, callback);
    };
  }

  function continuation(parent, domain) {
    var current = parent.next, scope = domain.scope, result = parent.result;
    if (result === false) return;
    return result[0] != null ? callback(result[0]) : runThunk(domain.ctx, result[1], callback);

    function callback(error) {
      var args = arguments;
      if (parent.result === false) return;
      parent.result = false;
      if (scope.debug) scope.debug.apply(null, args);
      if (error == null) {
        if (!args.length) args = [null];
        else args[0] = null;
      } else {
        args = [error];
        if (scope.onerror) {
          if (scope.onerror.call(null, error) !== true) return;
          // if onerror return true then continue
          args = [null];
        }
      }

      if (parent.callback === noOp) return noOp(args[0]);
      current.result = tryRun(domain.ctx, parent.callback, args);
      if (current.callback) return continuation(current, domain);
      if (current.result[0] != null) nextTick(function() {
        if (current.result) noOp(current.result[0]);
      });
    }
  }

  function childThunk(parent, domain) {
    parent.next = {callback: null, result: null};
    return function(callback) {
      return child(parent, domain, callback);
    };
  }

  function child(parent, domain, callback) {
    parent.callback = callback || noOp;
    if (parent.result) continuation(parent, domain);
    return childThunk(parent.next, domain);
  }

  function thunks(options) {
    var scope = {onerror: null, debug: null};
    if (isFunction(options)) scope.onerror = options;
    else if (options) {
      if (isFunction(options.debug)) scope.debug = options.debug;
      if (isFunction(options.onerror)) scope.onerror = options.onerror;
    }

    function Thunk(start) {
      return childThunk({callback: null, result: [null, start]}, {ctx: this === Thunk ? null : this, scope: scope});
    }

    Thunk.all = function(obj) {
      if (arguments.length > 1) obj = slice(arguments);
      return Thunk.call(this, objectToThunk(obj));
    };

    Thunk.seq = function(array) {
      if (arguments.length !== 1 || !isArray(array)) array = arguments;
      return Thunk.call(this, sequenceToThunk(array));
    };

    Thunk.race = function(array) {
      if (arguments.length > 1) array = slice(arguments);
      return Thunk.call(this, function(done) {
        for (var i = 0, l = array.length; i < l; i++) Thunk.call(this, array[i])(done);
      });
    };

    Thunk.digest = function() {
      var args = arguments;
      return Thunk.call(this, function(callback) {
        callback.apply(null, args);
      });
    };

    Thunk.thunkify = function(fn) {
      var ctx = this === Thunk ? null : this;
      return function() {
        var args = slice(arguments);
        return Thunk.call(ctx || this, function(callback) {
          args.push(callback);
          fn.apply(this, args);
        });
      };
    };

    Thunk.delay = function(delay) {
      return Thunk.call(this, function(callback) {
        return delay > 0 ? setTimeout(callback, delay) : nextTick(callback);
      });
    };

    return Thunk;
  }
}));
