Thunk v0.3.1 [![Build Status](https://travis-ci.org/teambition/thunk.png?branch=master)](https://travis-ci.org/teambition/thunk)
====
Thunk! A magical async flow control.

## thunk?

**`thunk`** 是一个被封装了同步或异步任务的函数，这个函数有唯一一个参数 `callback`。运行 **`thunk`**后，当其封装的任务执行完毕时，任务结果会输入 `callback` 执行。`callback` 的第一个参数是 `error`，没有发生 `error` 则为 `null`。

**`thunk`** 运行后返回一个新的 **`thunk`**，从而形成链式调用！

## Async Chain

    Thunk(function (callback) {
      // ...
    })(function(error, value){
      // ...
    })(function(error, value){
      // ...
    })(function(error, value){
      // ...
    })

## Demo1

    var Thunkjs = require('../thunk.js');
    var fs = require('fs');
    var Thunk = Thunkjs(function (error) { console.error('Thunk error:', error); });

    Thunk.
      all(['examples/demo.js', 'thunk.js', '.gitignore'].map(function (path) {
        return Thunk(function (callback) { fs.stat(path, callback); });
      }))(function (error, result) {
        console.log('Success: ', result);
        return Thunk(function (callback) { fs.stat('none.js', callback); });
      })(function (error, result) {
        console.error('This should not run!', error);
      });

## Demo2

    var Thunk = require('../thunk.js')();
    var thunk = Thunk(0);

    function callback(error, value) {
      return ++value;
    }

    console.time('Thunk_series');
    for (var i = 0; i < 1000000; i++) {
      thunk = thunk(callback);
    }

    thunk(function (error, value) {
      console.log(error, value); // null, 1000000
      console.timeEnd('Thunk_series'); // ~1468ms
    });

## API

    var Thunkjs = require('./thunk.js');

### Thunkjs([options])

`Thunk` 生成器函数，生成一个带作用域的 `Thunk` 主函数，作用域是指该 `Thunk` 直接或间接生成的所有 `thunk` 函数的内部运行环境。

生成基本形式的 `Thunk`，任何异常会输入到下一个 `thunk` 函数：

    var Thunk = Thunkjs();

生成有 `onerror` 监听的 `Thunk`，该 `Thunk` 作用域内的任何异常都可被 `onerror` 捕捉，而不会进入下一个 `thunk` 函数：

    var Thunk = Thunkjs(function (error) { console.error(error); });

生成有 `onerror` 监听和 `debug` 监听的 `Thunk`，`onerror` 同上，该 `Thunk` 作用域内的所有运行结果都会先进入 `debug` 函数，然后再进入下一个 `thunk` 函数：

    var Thunk = Thunkjs({
      onerror: function (error) { console.error(error); },
      debug: function () { console.log.apply(console, arguments); }
    });

拥有不同作用域的多个 `Thunk` 主函数组合成复杂逻辑体时，各自的作用域仍然相互隔离，也就是说 `onerror` 监听和 `debug` 监听不会在其它作用域运行。

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
        });


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
    });
