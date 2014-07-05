thunks v0.6.2 [![Build Status](https://travis-ci.org/teambition/thunks.png?branch=master)](https://travis-ci.org/teambition/thunks)
====
Thunks! A magical async flow control.

## Thunk?

1. **`thunk`** 是一个被封装了同步或异步任务的函数；

2. **`thunk`** 有唯一一个参数 `callback`，是 CPS 函数；

3. **`thunk`** 运行后返回新的 **`thunk`** 函数，形成链式调用；

4. **`thunk`** 自身执行完毕后，结果进入 `callback` 运行；

5. `callback` 的返回值如果是 **`thunk`** 函数，则等该 **`thunk`** 执行完毕将结果输入新 **`thunk`** 函数运行；如果是其它值，则当做正确结果进入新的 **`thunk`** 函数运行；

## Async Chain By Thunk

    Thunk(function (callback) {
      // ...
      callback(null, value)
    })(function(error, value){
      // ...
      return value
    })(function(error, value){
      // ...
      return Thunk(function (callback) { // nest thunk
        // ...
        callback(null, value)
      })(function (error, value) {

      })
    })(function(error, value){
      // ...
    })

##Benchmark

`node benchmark/index.js`，centos 虚拟机中测试结果：

    [root@centos thunk]# node benchmark/index
    Sync Benchmark...

    JSBench Start (100 cycles, async mode):
    Test Promise...
    Test thunk...

    JSBench Results:
    Promise: 100 cycles, 406.61 ms/cycle, 2.459 ops/sec
    thunk: 100 cycles, 94.57 ms/cycle, 10.574 ops/sec

    Promise: 100%; thunk: 429.96%;

    JSBench Completed!

  **完全相同的测试逻辑，thunk 比原生 Promise 快 4 倍**

## Demo

    var thunks = require('../thunks.js');
    var fs = require('fs');
    var Thunk = thunks(function (error) { console.error('Thunk error:', error); });

    Thunk.
      all(['examples/demo.js', 'thunks.js', '.gitignore'].map(function (path) {
        return Thunk(function (callback) { fs.stat(path, callback); });
      }))(function (error, result) {
        console.log('Success: ', result);
        return Thunk(function (callback) { fs.stat('none.js', callback); });
      })(function (error, result) {
        console.error('This should not run!', error);
      });

// No `Maximum call stack size exceeded` error in 1000000 sync series

    var Thunk = require('../thunks.js')();
    var thunk = Thunk(0);

    function callback(error, value) {
      return ++value;
    }

    console.time('Thunk_series');
    for (var i = 0; i < 1000000; i++) {
      thunk = thunk(callback);
    }

    thunk(function (error, value) {
      console.log(error, value); // null 1000000
      console.timeEnd('Thunk_series'); // ~1468ms
    });

## Install

**Node.js:**

    npm install thunks

**bower:**

    bower install thunks

**Browser:**

    <script src="/pathTo/thunks.js"></script>

## API

    var thunks = require('./thunks.js');

### thunks([options])

`Thunk` 生成器函数，生成一个带作用域的 `Thunk` 主函数，作用域是指该 `Thunk` 直接或间接生成的所有 `thunk` 函数的内部运行环境。

1. 生成基本形式的 `Thunk`，任何异常会输入到下一个 `thunk` 函数：

        var Thunk = thunks();

2. 生成有 `onerror` 监听的 `Thunk`，该 `Thunk` 作用域内的任何异常都可被 `onerror` 捕捉，而不会进入下一个 `thunk` 函数：

        var Thunk = thunks(function (error) { console.error(error); });

3. 生成有 `onerror` 监听和 `debug` 监听的 `Thunk`，`onerror` 同上，该 `Thunk` 作用域内的所有运行结果都会先进入 `debug` 函数，然后再进入下一个 `thunk` 函数：

        var Thunk = thunks({
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
          console.log(error, value); // null 1
        });

2. promise，promise的结果进入新的 `thunk` 函数

        var promise = Promise.resolve(1);

        Thunk(promise)(function (error, value) {
          console.log(error, value); // null 1
        });

2. 自带 `thunk` 方法的对象

        var then = Thenjs(1); // then.thunk is a thunk function

        Thunk(then)(function (error, value) {
          console.log(error, value); // null 1
        });

3. 其它值，当作有效结果进入新的 `thunk` 函数

        Thunk(1)(function (error, value) {
          console.log(error, value); // null 1
        });

        Thunk([1, 2, 3])(function (error, value) {
          console.log(error, value); // null [1, 2, 3]
        });

还可以这样运行：

    Thunk.call({x: 123}, 456)(function (error, value) {
      console.log(error, this.x, value); // null 123 456
      return 'thunk!';
    })(function (error, value) {
      console.log(error, this.x, value); // null 123 'thunk!'
    });


### Thunk.all(obj)

返回一个新的 `thunk` 函数。

`obj` 是一个包含多个 `thunk` 函数或 promise 的数组或对象，并发执行各个 `thunk` 函数，全部执行完毕后其结果形成一个新数组（顺序与原数组对应）或对象，输入到返回的新`thunk` 函数。

    Thunk.all([
      Thunk(0),
      Thunk(1),
      2,
      Thunk(function (callback) { callback(null, [3]); })
    ])(function (error, value) {
      console.log(error, value); // null [0, 1, 2, [3]]
    });

    Thunk.all({
      a: Thunk(0),
      b: Thunk(1),
      c: 2,
      d: Thunk(function (callback) { callback(null, [3]); })
    })(function (error, value) {
      console.log(error, value); // null {a: 0, b: 1, c: 2, d: [3]}
    });

还可以这样运行：

    Thunk.all.call({x: [1, 2, 3]}, [4, 5, 6])(function (error, value) {
      console.log(error, this.x, value); // null [1, 2, 3] [4, 5, 6]
      return 'thunk!';
    })(function (error, value) {
      console.log(error, this.x, value); // null [1, 2, 3] 'thunk!'
    });

### Thunk.digest(error, val1, val2, ...)

返回一个新的 `thunk` 函数。

创建 `thunk` 函数，其结果值为 `(error, val1, val2, ...)`，即直接将 `digest` 的参数传入到新的 `thunk` 函数，相当于：

    Thunk(function (callback) {
      callback(error, val1, val2, ...);
    })

使用场景：

    Thunk(function (callback) {
      //...
      callback(error, result);
    })(function (error, value) {
      //...
      return Thunk.digest(error, value);
    })(function (error, value) {
      //...
    });


还可以这样运行：

    var a = {x: 1};
    Thunk.digest.call(a, null, 1, 2)(function (error, value1, value2) {
      console.log(this, error, value1, value2) // { x: 1 } null 1 2
    });
