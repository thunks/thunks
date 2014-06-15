Thunk v0.1.0 [![Build Status](https://travis-ci.org/teambition/thunk.png?branch=master)](https://travis-ci.org/teambition/thunk)
====
Thunk! A magical async flow control.

## thunk?

**`thunk`** 是一个被封装了同步或异步任务的函数，这个函数有唯一一个参数 `callback`。运行 **`thunk`**后，当其封装的任务执行完毕时，任务结果会输入 `callback` 执行。`callback` 的第一个参数是 `error`，没有发生 `error` 则为 `null`。

**`thunk`** 运行后返回一个新的 **`thunk`**，从而形成链式调用！

## Async chain? YES!

    Thunk(function (callback) {
      // ...
    })(function(error, value){
      // ...
    })(function(error, value){
      // ...
    })

## Demo

    'use strict';
    /*global module, process*/

    var Thunk = require('../thunk.js');

    Thunk(function (callback) {
      callback(null, 1, 2, 3);
    })(function (error, value1, value2, value3) {
      console.log(error, value1, value2, value3); // null, 1, 2, 3
      return Thunk(function (callback) {
        setImmediate(function () {callback(null, 4, 5, 6);});
      })
    })(function (error, value1, value2, value3) {
      console.log(error, value1, value2, value3); // null, 4, 5, 6
      return [7, 8, 9];
    })(function (error, value) {
      console.log(error, value); // null, [7, 8, 9]

      var thunk1 = Thunk(1);

      var thunk2 = thunk1(function (error, value) {
        console.log(error, value); // null, 1
        return 2;
      });

      var thunk3 = thunk2(function (error, value) {
        return Thunk(function (callback) {
          setImmediate(function () {callback(null, 2);});
        });
      });

      thunk3(function (error, value) {
        console.log(error, value); // null, 2
        Thunk(Thunk(Thunk(999)))(function (error, value) {
          console.log(error, value); // null, 999
        });
      });
    });


## API

    var Thunk = require('./thunk.js');

### Thunk(start)

主构造函数，返回一个新的 `thunk` 函数。

其中 `start` 可以是：

1. `thunk` 函数，执行该函数，结果进入新的 `thunk` 函数

2. function (callback) {}，执行该函数，callback收集结果进入新的 `thunk` 函数

3. 其它值，当作有效结果进入新的 `thunk` 函数