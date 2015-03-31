// **Github:** https://github.com/thunks/thunks
//
// **License:** MIT

/* global module, define, setImmediate */
;(function(root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.thunks = factory();
}(typeof window === 'object' ? window : this, function() {
  'use strict';

  var maxTickDepth = 100, SIGSTOP = {};
  var toString = Object.prototype.toString, hasOwnProperty = Object.prototype.hasOwnProperty;
  var isArray = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };
  var nextTick = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    setTimeout(fn, 0);
  };

  thunks.NAME = 'thunks';
  thunks.VERSION = 'v2.7.2';
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
    var constr = obj.constructor;
    if (!constr) return false;
    if (constr.name === 'GeneratorFunction' || constr.displayName === 'GeneratorFunction') return true;
    return isGenerator(constr.prototype);
  }

  function noOp(err) {
    if (err == null) return;
    nextTick(function() {
      throw err;
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
    } catch (err) {
      result[0] = err;
    }
    return result;
  }

  function toThunk(obj, thunkObj) {
    if (!obj || isFunction(obj)) return obj;
    if (isGenerator(obj)) return generatorToThunk(obj);
    if (isFunction(obj.toThunk)) return obj.toThunk();
    if (isFunction(obj.then)) return promiseToThunk(obj);
    if (thunkObj && (isArray(obj) || isObject(obj))) return objectToThunk(obj);
    return obj;
  }

  function runThunk(ctx, value, callback, thunkObj, noTryRun) {
    var err, thunk = toThunk(value, thunkObj);
    if (!isFunction(thunk)) return thunk == null ? callback(null) : callback(null, thunk);
    if (isGeneratorFunction(thunk)) thunk = generatorToThunk(thunk.call(ctx));
    if (noTryRun) return thunk.call(ctx, callback);
    err = tryRun(ctx, thunk, [callback])[0];
    return err != null && callback(err);
  }

  function generatorToThunk(gen) {
    return function(callback) {
      var tickDepth = maxTickDepth, ctx = this;
      return run();

      function run(err, res) {
        if (err && err.code === SIGSTOP) return callback(err);
        var ret = err == null ? gen.next(res) : gen.throw(err);
        if (ret.done) return runThunk(ctx, ret.value, callback);
        if (--tickDepth) return runThunk(ctx, ret.value, next, true, true);
        return nextTick(function() {
          tickDepth = maxTickDepth;
          return runThunk(ctx, ret.value, next, true);
        });
      }

      function next(err, res) {
        try {
          return run(err, arguments.length > 2 ? slice(arguments, 1) : res);
        } catch (error) {
          return callback(error);
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
        runThunk(ctx, fn, function(err, res) {
          if (finished) return;
          if (err != null) {
            finished = true;
            return callback(err);
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

      function next(err, res) {
        if (err != null) return callback(err);
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

  function continuation(parent, domain, tickDepth) {
    var current = parent.next, scope = domain.scope, result = parent.result;
    tickDepth = tickDepth || maxTickDepth;
    return result[0] != null ? callback(result[0]) : runThunk(domain.ctx, result[1], callback);

    function callback(err) {
      if (parent.result === false) return;
      parent.result = false;
      var args = arguments;
      if (scope.debug) scope.debug.apply(null, args);
      if (!args.length) args = [null];
      else if (err == null) args[0] = null;
      else {
        args = [err];
        if (err && err.code === SIGSTOP) return;
        if (scope.onerror) {
          if (scope.onerror.call(null, err) !== true) return;
          args[0] = null; // if onerror return true then continue
        }
      }

      current.result = tryRun(domain.ctx, parent.callback, args);
      if (current.callback) {
        if (--tickDepth) return continuation(current, domain, tickDepth);
        return nextTick(function() {
          continuation(current, domain, 0);
        });
      }
      if (current.result[0] != null) nextTick(function() {
        if (!current.result) return;
        if (scope.onerror && scope.onerror.call(null, current.result[0]) !== true) return;
        noOp(current.result[0]);
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
    if (parent.callback) throw new Error('The thunk already filled');
    parent.callback = callback || noOp;
    if (!isFunction(parent.callback)) throw new TypeError(String(callback) + ' is not a function');
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

    Thunk.stop = function(message) {
      throw {
        message: String(message || 'thunk stoped'),
        code: SIGSTOP,
        status: 19
      };
    };

    return Thunk;
  }
}));
