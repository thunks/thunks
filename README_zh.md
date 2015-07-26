thunks
====
A small and magical async control flow tool, wrap promise, generator and anything to thunk.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![js-standard-style][js-standard-image]][js-standard-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Downloads][downloads-image]][downloads-url]
[![Talk topic][talk-image]][talk-url]

## [Toa](https://github.com/toajs/toa): A powerful web framework rely on thunks.

[thunks 的作用域和异常处理设计](https://github.com/thunks/thunks/blob/master/docs/scope-and-error-catch.md)

## Compatibility

ES3+, support node.js and all browsers.

## thunk?

1. **`thunk`** 是一个被封装了同步或异步任务的函数；

2. **`thunk`** 有唯一一个参数 `callback`，是 CPS 函数；

3. **`thunk`** 运行后返回新的 **`thunk`** 函数，形成链式调用；

4. **`thunk`** 自身执行完毕后，结果进入 `callback` 运行；

5. `callback` 的返回值如果是 **`thunk`** 函数，则等该 **`thunk`** 执行完毕将结果输入新 **`thunk`** 函数运行；如果是其它值，则当做正确结果进入新的 **`thunk`** 函数运行；

## Demo

```js
var thunk = require('../thunks.js')()
var fs = require('fs')

var size = thunk.thunkify(fs.stat)

// generator
thunk(function *() {

  // sequential
  console.log(yield size('.gitignore'))
  console.log(yield size('thunks.js'))
  console.log(yield size('package.json'))

})(function *(error, res) {
  //parallel
  console.log(yield [
    size('.gitignore'),
    size('thunks.js'),
    size('package.json')
  ])
})()
```

```js
var thunk = require('../thunks.js')()
var fs = require('fs')

var size = thunk.thunkify(fs.stat)

// sequential
size('.gitignore')(function (error, res) {
  console.log(error, res)
  return size('thunks.js')

})(function (error, res) {
  console.log(error, res)
  return size('package.json')

})(function (error, res) {
  console.log(error, res)
})

// parallel
thunk.all([
  size('.gitignore'),
  size('thunks.js'),
  size('package.json')
])(function (error, res) {
  console.log(error, res)
})

// sequential
thunk.seq([
  size('.gitignore'),
  size('thunks.js'),
  size('package.json')
])(function (error, res) {
  console.log(error, res)
})
```

## Install

**Node.js:**

```sh
npm install thunks
```

**bower:**

```sh
bower install thunks
```

**Browser:**

```html
<script src="/pathTo/thunks.js"></script>
```

## API

```js
var thunks = require('thunks')
```

### thunks([options])

母函数，生成一个带作用域的 `thunk` 生成器，作用域是指该 `thunk` 生成器直接或间接生成的所有子 thunk 函数的内部运行环境。

1. 生成基本形式的 `thunk`，任何异常会输入到下一个子 thunk 函数：

  ```js
  var thunk = thunks()
  ```

2. 生成有 `onerror` 监听的 `thunk`，该 `thunk` 作用域内的任何异常都可被 `onerror` 捕捉，而不会进入下一个 子 thunk 函数，除非 `onerror` 返回 `true`：

  ```js
  var thunk = thunks(function (error) { console.error(error) })
  ```

3. 生成有 `onerror` 监听，`onstop` 监听和 `debug` 监听的 `thunk`，`onerror` 同上，该 `thunk` 作用域内的所有运行结果都会先进入 `debug` 函数，然后再进入下一个子 thunk 函数：

  ```js
  var thunk = thunks({
    onstop: function (sig) { console.log(sig) },
    onerror: function (error) { console.error(error) },
    debug: function () { console.log.apply(console, arguments) }
  })
  ```

拥有不同作用域的多个 `thunk` 生成器组合成复杂逻辑体时，各自的作用域仍然相互隔离，也就是说 `onerror` 监听和 `debug` 监听不会在其它作用域运行。

### thunk(thunkable)

生成器，生成一个新的子 thunk 函数。

其中 `thunkable` 可以是：

1. 子 thunk 函数，执行该函数，结果进入新的子 thunk 函数

  ```js
  var thunk1 = thunk(1)
  var thunk2 = thunk(thunk1) // thunk2 等效于 thunk1
  ```

2. function (callback) {}，执行该函数，callback收集结果进入新的子 thunk 函数

  ```js
  thunk(function (callback) {
    callback(null, 1)
  })(function (error, value) {
    console.log(error, value) // null 1
  })
  ```

3. promise，promise的结果进入新的子 thunk 函数

  ```js
  var promise = Promise.resolve(1)

  thunk(promise)(function (error, value) {
    console.log(error, value) // null 1
  })
  ```

4. 自带 `toThunk` 方法的对象

  ```js
  var then = Thenjs(1) // then.toThunk() 能转换成 thunk 形式的函数，也能用于 `co`

  thunk(then)(function (error, value) {
    console.log(error, value) // null 1
  })
  ```

5. Generator 或 Generator Function, 与 `co` 类似，但更进一步，可以 `yield` 任何值，可以形成链式调用

  ```js
  thunk(function *() {
    var x = yield 10
    return 2 * x
  })(function *(error, res) {
    console.log(error, res) // null, 20

    return yield [1, 2, thunk(3)]
  })(function *(error, res) {
    console.log(error, res) // null, [1, 2, 3]
    return yield {
      name: 'test',
      value: thunk(1)
    }
  })(function (error, res) {
    console.log(error, res) // null, {name: 'test', value: 1}
  })
  ```

6. 其它值，当作有效结果进入新的子 thunk 函数

  ```js
  thunk(1)(function (error, value) {
    console.log(error, value) // null 1
  })

  thunk([1, 2, 3])(function (error, value) {
    console.log(error, value) // null [1, 2, 3]
  })
  ```

还可以这样运行(this)：

```js
thunk.call({x: 123}, 456)(function (error, value) {
  console.log(error, this.x, value) // null 123 456
  return 'thunk!'
})(function (error, value) {
  console.log(error, this.x, value) // null 123 'thunk!'
})
```


### thunk.all(obj)
### thunk.all(thunk1, ..., thunkX)

返回一个新的子 thunk 函数。

`obj` 是一个包含多个子 thunk 函数或 promise 的数组或对象，并发执行各个子 thunk 函数，全部执行完毕后其结果形成一个新数组（顺序与原数组对应）或对象，输入到返回的新子 thunk 函数。

```js
thunk.all([
  thunk(0),
  thunk(1),
  2,
  thunk(function (callback) { callback(null, [3]) })
])(function (error, value) {
  console.log(error, value) // null [0, 1, 2, [3]]
})
```

```js
thunk.all({
  a: thunk(0),
  b: thunk(1),
  c: 2,
  d: thunk(function (callback) { callback(null, [3]) })
})(function (error, value) {
  console.log(error, value) // null {a: 0, b: 1, c: 2, d: [3]}
})
```

还可以这样运行(this)：

```js
thunk.all.call({x: [1, 2, 3]}, [4, 5, 6])(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] [4, 5, 6]
  return 'thunk!'
})(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] 'thunk!'
})
```

### thunk.seq([thunk1, ..., thunkX])
### thunk.seq(thunk1, ..., thunkX)

返回一个新的子 thunk 函数。

`thunkX` 可以是任何值，`thunk.seq` 会按照顺序将其转换子 thunk 函数 并逐步执行，全部执行完毕后其结果形成一个新数组（顺序与原数组对应），输入到返回的新子 thunk 函数。

```js
thunk.seq([
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b')
    }, 100)
  },
  thunk(function (callback) {
    callback(null, 'c')
  }),
  [thunk('d'), thunk('e')], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true])
    flag[2] = true
    callback(null, 'f')
  }
])(function (error, value) {
  console.log(error, value) // null [['a', 'b'], 'c', ['d', 'e'], 'f']
})
```
or

```js
thunk.seq(
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b')
    }, 100)
  },
  thunk(function (callback) {
    callback(null, 'c')
  }),
  [thunk('d'), thunk('e')], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true])
    flag[2] = true
    callback(null, 'f')
  }
)(function (error, value) {
  console.log(error, value) // null [['a', 'b'], 'c', ['d', 'e'], 'f']
})
```

还可以这样运行(this)：

```js
thunk.seq.call({x: [1, 2, 3]}, 4, 5, 6)(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] [4, 5, 6]
  return 'thunk!'
})(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] 'thunk!'
})
```

### thunk.race([thunk1, ..., thunkX])
### thunk.race(thunk1, ..., thunkX)

返回一个新的子 thunk 函数。迭代数组所有子 thunk 函数最先完成的运算结果会传入其中，无论正确或错误。

### thunk.digest(error, val1, val2, ...)

返回一个新的子 thunk 函数。

将 nodejs callback 风格的输入值转换成一个新的子 thunk 函数，该子 thunk 函数的结果值为 `(error, val1, val2, ...)`，即直接将 `digest` 的参数传入到新的子 thunk 函数，相当于：

```js
thunk(function (callback) {
  callback(error, val1, val2, ...)
})
```

使用场景：

```js
thunk(function (callback) {
  //...
  callback(error, result)
})(function (error, value) {
  //...
  return thunk.digest(error, value)
})(function (error, value) {
  //...
})
```

还可以这样运行(this)：

```js
var a = {x: 1}
thunk.digest.call(a, null, 1, 2)(function (error, value1, value2) {
  console.log(this, error, value1, value2) // { x: 1 } null 1 2
})
```

### thunk.thunkify(fn)

返回一个新函数，运行该函数会返回子 thunk 函数。

将带 callback 参数的 nodejs 风格的函数 `fn` 转换成一个新的函数，新函数不再接收 `callback`，其输出为子 thunk 函数。

```js
var thunk = require('../thunks.js')()
var fs = require('fs')
var fsStat = thunk.thunkify(fs.stat)

fsStat('thunks.js')(function (error, result) {
  console.log('thunks.js: ', result)
})
fsStat('.gitignore')(function (error, result) {
  console.log('.gitignore: ', result)
})
```

还可以这样运行(this)：

```js
var obj = {a: 8}
function run (x, callback) {
  //...
  callback(null, this.a * x)
}

var run = thunk.thunkify.call(obj, run)

run(1)(function (error, result) {
  console.log('run 1: ', result)
})
run(2)(function (error, result) {
  console.log('run 2: ', result)
})
```

### thunk.lift(fn)

`lift` 概念来自于 Haskell，它将一个同步函数转化成一个异步函数。该异步函数接受 `thunkable` 参数，等所有参数求得真实值后，再按照原函数逻辑运行。该异步函数返回子 thunk 函数。

```js
var thunk = require('../thunks.js')()

function calculator (a, b, c) {
  return (a + b + c) * 10
}

var calculatorT = thunk.lift(calculator)

var value1 = thunk(2)
var value2 = Promise.resolve(3)

calculatorT(value1, value2, 5)(function (error, result) {
  console.log(result) // 100
})
```

You may also write code with `this`:

```js
var calculatorT = thunk.lift.call(context, calculator)
```

### thunk.persist(thunkable)

将 `thunkable` 值转换成一个可以持久化的 thunk 函数，可以无限次运行该函数而取得其值。

```js
var thunk = require('../thunks.js')()

var persistThunk = thunk.persist(thunk(x))

persistThunk(function (error, result) {
  console.log(1, result) // x
  return persistThunk(function (error, result) {
    console.log(2, result) // x
    return persistThunk
  })
})(function (error, result) {
  console.log(3, result) // x
})
```

You may also write code with `this`:

```js
var persistThunk = thunk.persist.call(context, thunkable)
```

### thunk.delay(delay)

返回一个新的子 thunk 函数，该子 thunk 函数的主体将会在 `delay` 毫秒之后运行。

```js
console.log('thunk.delay 500: ', Date.now())
thunk.delay(500)(function () {
  console.log('thunk.delay 1000: ', Date.now())
  return thunk.delay(1000)
})(function () {
  console.log('thunk.delay end: ', Date.now())
})
```

还可以这样运行(this)：

```js
console.log('thunk.delay start: ', Date.now())
thunk.delay.call(this, 1000)(function () {
  console.log('thunk.delay end: ', Date.now())
})
```

### thunk.stop([messagge])

终止 `thunk` 函数组合体的运行，类似于 `Promise` 的 `cancelable`(ES6 没有定义，原生 Promise 也未实现)。运行 `thunk.stop` 将抛出一个终止信号对象。终止信号能被作用域的 `onstop` 捕获，但也能被 `try catch` 捕获并屏蔽。

终止信号拥有 `message`、特殊的 `code` 和 `status === 19`（POSIX signal SIGSTOP）。

```js
var thunk = require('thunks')({
  debug: function (res) {
    if (res) console.log(res) // { [Error: Stop now!] code: {}, status: 19 }
  }
})

thunk(function (callback) {
  thunk.stop('Stop now!')
  console.log('It will not be run!')
})(function (error, value) {
  console.log('It will not be run!')
})
```

```js
thunk.delay(100)(function () {
  console.log('Hello')
  return thunk.delay(100)(function () {
    thunk.stop('Stop now!')
    console.log('It will not be run!')
  })
})(function (error, value) {
  console.log('It will not be run!')
})
```

## Who's using

+ Teambition: https://www.teambition.com/ use in server-side and client-side

[npm-url]: https://npmjs.org/package/thunks
[npm-image]: http://img.shields.io/npm/v/thunks.svg

[travis-url]: https://travis-ci.org/thunks/thunks
[travis-image]: http://img.shields.io/travis/thunks/thunks.svg

[coveralls-url]: https://coveralls.io/r/thunks/thunks
[coveralls-image]: https://coveralls.io/repos/thunks/thunks/badge.svg

[downloads-url]: https://npmjs.org/package/thunks
[downloads-image]: http://img.shields.io/npm/dm/thunks.svg?style=flat-square

[talk-url]: https://guest.talk.ai/rooms/d1ccbf802n
[talk-image]: https://img.shields.io/talk/t/d1ccbf802n.svg

[js-standard-url]: https://github.com/feross/standard
[js-standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
