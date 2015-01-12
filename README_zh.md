thunks
====
A small and magical async control flow tool, wrap promise, generator and anything to thunk.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Talk topic][talk-image]][talk-url]

# [toa](https://github.com/toajs/toa): A web app framework rely on thunks.

[thunks 的作用域和异常处理设计](https://github.com/thunks/thunks/blob/master/docs/scope-and-error-catch.md)

## Compatibility

ES3+, support node.js and all browsers.

## thunk?

1. **`thunk`** 是一个被封装了同步或异步任务的函数；

2. **`thunk`** 有唯一一个参数 `callback`，是 CPS 函数；

3. **`thunk`** 运行后返回新的 **`thunk`** 函数，形成链式调用；

4. **`thunk`** 自身执行完毕后，结果进入 `callback` 运行；

5. `callback` 的返回值如果是 **`thunk`** 函数，则等该 **`thunk`** 执行完毕将结果输入新 **`thunk`** 函数运行；如果是其它值，则当做正确结果进入新的 **`thunk`** 函数运行；

## Benchmark

```js
➜  thunks git:(master) ✗ node --harmony benchmark/index
Sync Benchmark...

JSBench Start (1000 cycles, async mode):
Test Promise...
Test co...
Test thunks-generator...
Test bluebird...
Test when...
Test RSVP...
Test async...
Test thenjs...
Test thunks...

JSBench Results:
co: 1000 cycles, 25.454 ms/cycle, 39.287 ops/sec
Promise: 1000 cycles, 24.594 ms/cycle, 40.660 ops/sec
thunks: 1000 cycles, 7.276 ms/cycle, 137.438 ops/sec
thunks-generator: 1000 cycles, 5.577 ms/cycle, 179.308 ops/sec
async: 1000 cycles, 2.788 ms/cycle, 358.680 ops/sec
RSVP: 1000 cycles, 2.225 ms/cycle, 449.438 ops/sec
when: 1000 cycles, 1.816 ms/cycle, 550.661 ops/sec
bluebird: 1000 cycles, 1.67 ms/cycle, 598.802 ops/sec
thenjs: 1000 cycles, 1.345 ms/cycle, 743.494 ops/sec

co: 100%; Promise: 103.50%; thunks: 349.84%; thunks-generator: 456.41%; async: 912.98%; RSVP: 1144.00%; when: 1401.65%; bluebird: 1524.19%; thenjs: 1892.49%;

JSBench Completed!

```

```js
➜  thunks git:(master) ✗ node --harmony benchmark/index
Async Benchmark...

JSBench Start (1000 cycles, async mode):
Test Promise...
Test co...
Test thunks-generator...
Test bluebird...
Test when...
Test RSVP...
Test async...
Test thenjs...
Test thunks...

JSBench Results:
co: 1000 cycles, 32.755 ms/cycle, 30.530 ops/sec
Promise: 1000 cycles, 31.139 ms/cycle, 32.114 ops/sec
thunks: 1000 cycles, 11.388 ms/cycle, 87.812 ops/sec
RSVP: 1000 cycles, 10.155 ms/cycle, 98.474 ops/sec
thunks-generator: 1000 cycles, 10.126 ms/cycle, 98.756 ops/sec
when: 1000 cycles, 8.835 ms/cycle, 113.186 ops/sec
bluebird: 1000 cycles, 8.352 ms/cycle, 119.732 ops/sec
async: 1000 cycles, 6.477 ms/cycle, 154.392 ops/sec
thenjs: 1000 cycles, 4.939 ms/cycle, 202.470 ops/sec

co: 100%; Promise: 105.19%; thunks: 287.63%; RSVP: 322.55%; thunks-generator: 323.47%; when: 370.74%; bluebird: 392.18%; async: 505.71%; thenjs: 663.19%;

JSBench Completed!
```

## Demo

```js
var Thunk = require('../thunks.js')();
var fs = require('fs');

var size = Thunk.thunkify(fs.stat);

// sequential
size('.gitignore')(function (error, res) {
  console.log(error, res);
  return size('thunks.js');

})(function (error, res) {
  console.log(error, res);
  return size('package.json');

})(function (error, res) {
  console.log(error, res);
})

// parallel
Thunk.all([size('.gitignore'), size('thunks.js'), size('package.json')])(function (error, res) {
  console.log(error, res);
})

// sequential
Thunk.seq([size('.gitignore'), size('thunks.js'), size('package.json')])(function (error, res) {
  console.log(error, res);
})
```

```js
var Thunk = require('../thunks.js')();
var fs = require('fs');

var size = Thunk.thunkify(fs.stat);


// generator
Thunk(function* () {

  // sequential
  console.log(yield size('.gitignore'));
  console.log(yield size('thunks.js'));
  console.log(yield size('package.json'));

})(function* (error, res) {
  //parallel
  console.log(yield [size('.gitignore'), size('thunks.js'), size('package.json')]);
})();
```

## Install

**Node.js:**

    npm install thunks

**bower:**

    bower install thunks

**Browser:**

    <script src="/pathTo/thunks.js"></script>

## API

    var thunks = require('thunks');

### thunks([options])

`Thunk` 生成器函数，生成一个带作用域的 `Thunk` 主函数，作用域是指该 `Thunk` 直接或间接生成的所有 `thunk` 函数的内部运行环境。

1. 生成基本形式的 `Thunk`，任何异常会输入到下一个 `thunk` 函数：

        var Thunk = thunks();

2. 生成有 `onerror` 监听的 `Thunk`，该 `Thunk` 作用域内的任何异常都可被 `onerror` 捕捉，而不会进入下一个 `thunk` 函数，除非 `onerror` 返回 `true`：

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

    ```js
    var thunk1 = Thunk(1);
    var thunk2 = Thunk(thunk1); // thunk2 等效于 thunk1;
    ```

2. function (callback) {}，执行该函数，callback收集结果进入新的 `thunk` 函数

    ```js
    Thunk(function (callback) {
      callback(null, 1)
    })(function (error, value) {
      console.log(error, value); // null 1
    });
    ```

3. promise，promise的结果进入新的 `thunk` 函数

    ```js
    var promise = Promise.resolve(1);

    Thunk(promise)(function (error, value) {
      console.log(error, value); // null 1
    });
    ```

4. 自带 `toThunk` 方法的对象

    ```js
    var then = Thenjs(1); // then.toThunk() 能转换成 thunk 形式的函数，也能用于 `co`

    Thunk(then)(function (error, value) {
      console.log(error, value); // null 1
    });
    ```

5. Generator 或 Generator Function, 与 `co` 类似，但更进一步，可以 `yield` 任何值，可以形成链式调用

    ```js
    Thunk(function* () {
      var x = yield 10;
      return 2 * x;
    })(function* (error, res) {
      console.log(error, res); // null, 20

      return yield [1, 2, Thunk(3)];
    })(function* (error, res) {
      console.log(error, res); // null, [1, 2, 3]
      return yield {
        name: 'test',
        value: Thunk(1)
      };
    })(function (error, res) {
      console.log(error, res); // null, {name: 'test', value: 1}
    });
    ```

6. 其它值，当作有效结果进入新的 `thunk` 函数

    ```js
    Thunk(1)(function (error, value) {
      console.log(error, value); // null 1
    });

    Thunk([1, 2, 3])(function (error, value) {
      console.log(error, value); // null [1, 2, 3]
    });
    ```

还可以这样运行(this)：

```js
Thunk.call({x: 123}, 456)(function (error, value) {
  console.log(error, this.x, value); // null 123 456
  return 'thunk!';
})(function (error, value) {
  console.log(error, this.x, value); // null 123 'thunk!'
});
```


### Thunk.all(obj)
### Thunk.all(thunk1, ..., thunkX)

返回一个新的 `thunk` 函数。

`obj` 是一个包含多个 `thunk` 函数或 promise 的数组或对象，并发执行各个 `thunk` 函数，全部执行完毕后其结果形成一个新数组（顺序与原数组对应）或对象，输入到返回的新`thunk` 函数。

```js
Thunk.all([
  Thunk(0),
  Thunk(1),
  2,
  Thunk(function (callback) { callback(null, [3]); })
])(function (error, value) {
  console.log(error, value); // null [0, 1, 2, [3]]
});
```

```js
Thunk.all({
  a: Thunk(0),
  b: Thunk(1),
  c: 2,
  d: Thunk(function (callback) { callback(null, [3]); })
})(function (error, value) {
  console.log(error, value); // null {a: 0, b: 1, c: 2, d: [3]}
});
```

还可以这样运行(this)：

```js
Thunk.all.call({x: [1, 2, 3]}, [4, 5, 6])(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] [4, 5, 6]
  return 'thunk!';
})(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] 'thunk!'
});
```

### Thunk.seq([thunk1, ..., thunkX])
### Thunk.seq(thunk1, ..., thunkX)

返回一个新的 `thunk` 函数。

`thunkX` 可以是任何值，`Thunk.seq` 会按照顺序将其转换 `thunk` 函数并逐步执行，全部执行完毕后其结果形成一个新数组（顺序与原数组对应，输入到返回的新`thunk` 函数。

```js
Thunk.seq([
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b');
    }, 100);
  },
  Thunk(function (callback) {
    callback(null, 'c');
  }),
  [Thunk('d'), Thunk('e')], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true]);
    flag[2] = true;
    callback(null, 'f');
  }
])(function (error, value) {
  console.log(error, value); // null [['a', 'b'], 'c', ['d', 'e'], 'f']
});
```
or

```js
Thunk.seq(
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b');
    }, 100);
  },
  Thunk(function (callback) {
    callback(null, 'c');
  }),
  [Thunk('d'), Thunk('e')], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true]);
    flag[2] = true;
    callback(null, 'f');
  }
)(function (error, value) {
  console.log(error, value); // null [['a', 'b'], 'c', ['d', 'e'], 'f']
});
```

还可以这样运行(this)：

```js
Thunk.seq.call({x: [1, 2, 3]}, 4, 5, 6)(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] [4, 5, 6]
  return 'thunk!';
})(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] 'thunk!'
});
```

### Thunk.race([thunk1, ..., thunkX])
### Thunk.race(thunk1, ..., thunkX)

返回一个新的 `thunk` 函数。迭代数组所有 thunk 函数最先完成的运算结果会传入其中，无论正确或错误。

### Thunk.digest(error, val1, val2, ...)

返回一个新的 `thunk` 函数。

将 nodejs callback 风格的输入值转换成一个新的 `thunk` 函数，该 `thunk` 函数的结果值为 `(error, val1, val2, ...)`，即直接将 `digest` 的参数传入到新的 `thunk` 函数，相当于：

```js
Thunk(function (callback) {
  callback(error, val1, val2, ...);
})
```

使用场景：

```js
Thunk(function (callback) {
  //...
  callback(error, result);
})(function (error, value) {
  //...
  return Thunk.digest(error, value);
})(function (error, value) {
  //...
});
```

还可以这样运行(this)：

```js
var a = {x: 1};
Thunk.digest.call(a, null, 1, 2)(function (error, value1, value2) {
  console.log(this, error, value1, value2) // { x: 1 } null 1 2
});
```

### Thunk.thunkify(fn)

返回一个新函数，运行该函数会返回 `thunk` 函数。

将带 callback 参数的 nodejs 风格的函数 `fn` 转换成一个新的函数，新函数不再接收 `callback`，其输出为 `thunk` 函数。

```js
var Thunk = require('../thunks.js')();
var fs = require('fs');
var fsStat = Thunk.thunkify(fs.stat);

fsStat('thunks.js')(function (error, result) {
  console.log('thunks.js: ', result);
});
fsStat('.gitignore')(function (error, result) {
  console.log('.gitignore: ', result);
});
```

还可以这样运行(this)：

```js
var obj = {a: 8};
function run(x, callback) {
  //...
  callback(null, this.a * x);
};

var run = Thunk.thunkify.call(obj, run);

run(1)(function (error, result) {
  console.log('run 1: ', result);
});
run(2)(function (error, result) {
  console.log('run 2: ', result);
});
```

### Thunk.delay(delay)

返回一个新的 `thunk` 函数，该 `thunk` 函数的主体将会在 `delay` 毫秒之后运行。

```js
console.log('Thunk.delay 500: ', Date.now());
Thunk.delay(500)(function () {
  console.log('Thunk.delay 1000: ', Date.now());
  return Thunk.delay(1000);
})(function () {
  console.log('Thunk.delay end: ', Date.now());
});
```

还可以这样运行(this)：

```js
console.log('Thunk.delay start: ', Date.now());
Thunk.delay.call(this, 1000)(function () {
  console.log('Thunk.delay end: ', Date.now());
});
```

### Thunk.stop([messagge])

终止 `thunk` 函数的运行，类似于 `Promise` 的 `cancelable`(ES6 没有定义，原生 Promise 也未实现)。运行 `Thunk.stop` 将抛出一个终止信号对象。
终止信号能被作用域的 `debug` 捕获。

终止信号拥有 `message`、特殊的 `code` 和 `status === 19`（POSIX signal SIGSTOP）。

```js
var Thunk = require('thunks')({
  debug: function(res) {
    if (res) console.log(res); // { [Error: Stop now!] code: {}, status: 19 }
  }
});

Thunk(function(callback) {
  Thunk.stop('Stop now!');
  console.log('It will not be run!');
})(function(error, value) {
  console.log('It will not be run!');
});
```

```js
Thunk.delay(100)(function() {
  console.log('Hello');
  return Thunk.delay(100)(function() {
    Thunk.stop('Stop now!');
    console.log('It will not be run!');
  });
})(function(error, value) {
  console.log('It will not be run!');
});
```

[npm-url]: https://npmjs.org/package/thunks
[npm-image]: http://img.shields.io/npm/v/thunks.svg

[travis-url]: https://travis-ci.org/thunks/thunks
[travis-image]: http://img.shields.io/travis/thunks/thunks.svg

[talk-url]: https://guest.talk.ai/rooms/d1ccbf802n
[talk-image]: https://img.shields.io/talk/t/d1ccbf802n.svg
