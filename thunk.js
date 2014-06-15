// v0.0.1
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

  function isFunction(fn) {
    return typeof fn === 'function';
  }

  // ## **Thunk** 主函数
  function Thunk(start) {
    var current = {};

    if (isFunction(start)) {
      start._isThunk = true;
      continuation({
        next: current,
        result: [],
        callback: function () {return start;}
      });
    } else {
      current.result = [null, start];
    }

    return thunkFactory(current);
  }

  function thunkFactory(parent) {
    function thunk(callback) {
      var current = {};

      if (parent.result === false) return;
      if (!isFunction(callback)) throw new Error('not function!!');
      parent.callback = callback;
      parent.next = current;
      if (parent.result) continuation(parent);
      return thunkFactory(current);
    }
    thunk._isThunk = true;
    return thunk;
  }

  function continuation(parent) {
    var result, args = parent.result, current = parent.next;

    function callback() {
      if (current.result === false) return;
      current.result = arguments;
      if (current.callback) continuation(current);
    }
    // 当存在 `error` 时，截除其它结果
    if (args[0] != null) args = [args[0]];
    parent.result = false;
    try {
      result = parent.callback.apply(null, args);
    } catch (error) {
      return callback(error);
    }

    if (isFunction(result) && result._isThunk) {
      try {
        result(callback);
      } catch (error) {
        callback(error);
      }
    } else {
      callback(null, result);
    }
  }
  // TODO
  // Thunk.all = function (array) {};

  // Thunk.series = function (array) {};

  return Thunk;
}));
