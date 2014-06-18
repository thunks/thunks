// v0.3.2
//
// **Github:** https://github.com/teambition/thunk
//
// **License:** MIT

/* global module, define, setImmediate, console */
;(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.thunk = root.Thunk = factory();
  }
}(this, function () {
  'use strict';

  var toString = Object.prototype.toString,
    isArray = Array.isArray || function (obj) {
      return toString.call(obj) === '[object Array]';
    };

  function isFunction(fn) {
    return typeof fn === 'function';
  }

  // fast slice for `arguments`.
  function slice(args, start) {
    var ret = [], len = args.length;
    start = start || 0;
    while (len-- > start) ret[len - start] = args[len];
    return ret;
  }

  return function (options) {
    var scope = {};

    if (isFunction(options)) scope.onerror = options;
    else if (options) {
      scope.debug = isFunction(options.debug) ? options.debug : null;
      scope.onerror = isFunction(options.onerror) ? options.onerror : null;
    }

    function continuation(parent) {
      var result, args = parent.result, current = parent.next, onerror = scope.onerror || callback;

      function callback() {
        if (current.result === false) return;
        current.result = arguments;
        if (current.callback) continuation(current);
      }

      parent.result = false;
      // debug in scope
      if (scope.debug) scope.debug.apply(null, args);
      // onerror in scope.
      if (args[0] != null) {
        if (scope.onerror) return onerror(args[0]);
        args = [args[0]];
      }
      try {
        switch (args.length) {
          case 1: result = parent.callback(args[0]); break;
          case 2: result = parent.callback(args[0], args[1]); break;
          case 3: result = parent.callback(args[0], args[1], args[2]); break;
          default: result = parent.callback.apply(null, args);
        }
      } catch (error) {
        return onerror(error);
      }

      if (result == null) return callback(null);
      if (!(isFunction(result) && result._isThunk)) return callback(null, result);
      try {
        result(callback);
      } catch (error) {
        return onerror(error);
      }
    }

    // main fucntion **thunk**
    function Thunk(start) {
      var current = {};

      if (isFunction(start)) {
        start._isThunk = true;
        continuation({
          next: current,
          result: [null],
          callback: function () { return start; }
        });
      } else {
        current.result = start == null ? [null] : [null, start];
      }

      return thunkFactory(current);
    }

    function thunkFactory(parent) {
      function thunk(callback) {
        var current = {};

        if (parent.result === false) return;
        parent.callback = callback;
        parent.next = current;
        if (parent.result) continuation(parent);
        return thunkFactory(current);
      }
      thunk._isThunk = true;
      return thunk;
    }

    Thunk.all = function (array) {
      var current = {}, result = [], pending = array.length;

      function callback(error, result) {
        pending = 0;
        continuation({
          next: current,
          result: [null],
          callback: function () {
            if (error) throw error;
            return result;
          }
        });
      }

      function run(fn, index) {
        if (!(isFunction(fn) && fn._isThunk)) {
          result[index] = fn;
          return --pending || callback(null, result);
        }
        fn(function (error, res) {
          if (!pending) return;
          if (error) return callback(error);
          result[index] = arguments.length > 2 ? slice(arguments, 1) : res;
          return --pending || callback(null, result);
        });
      }

      function exec(thunks) {
        for (var i = pending - 1; i >= 0; i--) {
          run(thunks[i], i);
        }
      }

      if (!isArray(array)) callback(new Error('Not Array!!'));
      if (!pending) callback(null, result);
      try {
        exec(array);
      } catch (error) {
        callback(error);
      }

      return thunkFactory(current);
    };

    return Thunk;
  };
}));
