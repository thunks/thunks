// v0.3.0
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

  // 将 `arguments` 转成数组，效率比 `[].slice.call` 高很多
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
      var onerror, result, args = parent.result, current = parent.next;

      function callback() {
        if (current.result === false) return;
        current.result = arguments;
        if (current.callback) continuation(current);
      }

      onerror = scope.onerror || callback;
      parent.result = false;
      // 如果开启 debug
      if (scope.debug) scope.debug.apply(null, args);
      // 当存在 `error` 时，截除其它结果
      if (args[0] != null) {
        args = [args[0]];
        if (scope.onerror) return onerror(args[0]);
      }
      try {
        result = parent.callback.apply(null, args);
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

    // ## **thunk** 主函数
    function thunk(start) {
      var current = {};

      if (isFunction(start)) {
        start._isThunk = true;
        continuation({
          next: current,
          result: [],
          callback: function () {return start;}
        });
      } else {
        current.result = start == null ? [null] : [null, start];
      }

      return thunkFactory(current);
    }

    function thunkFactory(parent) {
      function _thunk(callback) {
        var current = {};

        if (parent.result === false) return;
        if (!isFunction(callback)) throw new Error('Not Function!!');
        parent.callback = callback;
        parent.next = current;
        if (parent.result) continuation(parent);
        return thunkFactory(current);
      }
      _thunk._isThunk = true;
      return _thunk;
    }

    thunk.all = function (array) {
      var current = {}, pending = array.length;

      function callback(error, result) {
        pending = 0;
        continuation({
          next: current,
          result: [],
          callback: function () {
            if (error) throw error;
            return result;
          }
        });
      }

      function done(thunks) {
        var result = [];

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

        for (var i = pending - 1; i >= 0; i--) {
          run(thunks[i], i);
        }
      }

      if (!isArray(array)) throw new Error('Not Array!!');
      if (!pending) callback(null, []);
      try {
        done(array);
      } catch (error) {
        callback(error);
      }

      return thunkFactory(current);
    };

    return thunk;
  };
}));
