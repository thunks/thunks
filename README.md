Thunk v0.2.1 [![Build Status](https://travis-ci.org/teambition/thunk.png?branch=master)](https://travis-ci.org/teambition/thunk)
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
    /*global console*/

    var Thunk = require('../thunk.js');
    var fs = require('fs');

    Thunk.
      all(['examples/demo.js', 'thunk.js', '.gitignore'].map(function (path) {
        return Thunk(function (callback) { fs.stat(path, callback); });
      }))(function (error, result) {
        console.log('Success: ', result);
        return Thunk(function (callback) { fs.stat('none.js', callback); });
      })(function (error, result) {
        console.error('Error: ', error);
      });


## API

    var Thunk = require('./thunk.js');

### Thunk(start)

主函数，返回一个新的 `thunk` 函数。

其中 `start` 可以是：

1. `thunk` 函数，执行该函数，结果进入新的 `thunk` 函数

        var thunk1 = Thunk(1);
        var thunk2 = Thunk(thunk1); // thunk2 等效于 thunk1;


2. function (callback) {}，执行该函数，callback收集结果进入新的 `thunk` 函数

        Thunk(function (callback) {
          callback(null, 1)
        })(function (error, value) {
          console.log(error, value); // null, 1
        });

3. 其它值，当作有效结果进入新的 `thunk` 函数

        Thunk(1)(function (error, value) {
          console.log(error, value); // null, 1
        })


### Thunk.all(array)

返回一个新的 `thunk` 函数。

`array` 是一个包含多个 `thunk` 函数的数组，并发执行各个 `thunk` 函数，全部执行完毕后其结果形成一个新数组（顺序与原数组对应），输入到返回的新`thunk` 函数。

    Thunk.all([
      Thunk(0),
      Thunk(1),
      2,
      Thunk(function (callback) { callback(null, [3]); })
    ])(function (error, value) {
      console.log(error, value); // null, [0, 1, 2, [3]]
    })
