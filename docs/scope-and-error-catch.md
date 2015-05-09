thunks 的作用域和异常处理设计
====
> 我认为，thunks 的作用域和异常处理设计是完美的，如果你发现不完美，那一定是 `bug`，请告知我来修复。

## 作用域

[thunks](https://github.com/thunks/thunks) 引入了作用域的概念，目前作用域中可以注册两个方法 `debug` 和 `onerror`。

```js
var thunks = require('thunks');
var thunk = thunks({
  onerror: function (error) {
    console.error(error);
  },
  debug: function () {
    console.log.apply(console, arguments);
  }
});

thunk(function (callback) {
  // do some thing ...
  callback(error, value);
})(function (error, res) {
  console.log(error, res);
});
```

### `thunks` 母函数

**母函数**，用于生成带作用域的 `thunk`；

### `thunk` 生成器

thunk 函数**生成器**，凡是使用同一个 `thunk` 生成器生成的任何 thunk 函数以及其派生的 thunk 链，都在同一个作用域内。（是否可以访问作用域？抱歉，为了代码安全，作用域是无形的存在，你访问不到~）

### `debug` 方法

可以捕捉该作用域内任何 thunk 函数的任何输出值，用于调试，`Promise` 没有这个能力。

### `onerror` 方法

可以捕捉作用域内任何异常，且异常一旦发生就会被捕捉，并且停止执行后续逻辑，除非 `onerror` 返回 `true`。

`Promise` 是在 promise 链上注册 `catch` 捕捉异常，然而实际场景中我们并不需要单独处理链上的异常，而是有任何异常都跳到同一个处理函数，这就是 `onerror`。即使有异常需要特别处理的 thunk 函数链，也可通过以下方法实现需求：

#### 方法一：

为特殊异常业务创建新的作用域。作用域是可以平行或任意嵌套的，它们之间不会相互干涉。比如 [thunk-redis](https://github.com/thunks/thunk-redis) 库作为第三方 API 库，不应该自己处理异常，而应该将异常抛给调用方处理：

```js
proto.hscan = function () {
  return sendCommand(this, 'hscan', tool.slice(arguments))(function (error, res) {
    if (error) throw error;
    res[1] = toHash(null, res[1]);
    return res;
  });
};
```

上面是 `thunk-redis` 的 `HSCAN` 命令实现，它的作用域上没有注册 `onerror`，如果发生异常，直接 `throw` 给下一链（调用方）处理。

而对于一个 http server，我们就需要对每一个请求创建独立作用域处理：

```js
http.createServer(function (req, res) {
  var thunk = thunks(function (error) {
    // 发生错误则将错误响应给用户
    res.renderError(error);
    // 如果是系统错误，则做相应处理，如写入日志等
    if (error.type === 'sys') catchSysError(error, req);
  })

  // sessionAuth 也经过了 thunks 封装
  thunk(sessionAuth(req))(function (error, result) {
    // error 必定为 null，不用管
    // 其它业务逻辑等，不管同步异步都可以用 thunks 封装，你懂的
  });
}).listen(80);
```

所以，取代 node.js 的 `domain` 是完全可行的，话说 `domain` 也不是好东西，将被淘汰。

#### 方法二：

由于 `onerror` 给了忽略异常的能力，所以，如果异常判定为可忽略，`return true` 就行了

#### 方法三：

thunk 函数内部自行 `try catch`，操作细节见后面示例。

### 几种 thunk 生成器的创建方式

1. 不注册任何方法：

  ```js
  var thunk = thunks();
  ```

2. 只注册 `onerror`：

  ```js
  var thunk = thunks(function (error) {
    console.error(error);
  });
  ```

  如果 `onerror` 返回 `true`，则会忽略错误，继续执行后续逻辑。

  ```js
  var thunk = thunks(function (error) {
    console.error(error);
    return true;
  });
  ```

3. 注册 `debug` 和 `onerror`：

  ```js
  var thunk = thunks({
    onerror: function (error) {
      console.error(error);
    },
    debug: function () {
      console.log.apply(console, arguments);
    }
  });
  ```

## 异常处理

见识了作用域，那么如果不添加 `onerror` 监听是不是就会丢失异常呢？显然不是：

```js
var thunk = require('thunks')();
```

```js
thunk(function (callback) {
  noneFn();
})();
// throw error: `ReferenceError: noneFn is not defined`
```

如上，异常将会被抛出系统：`ReferenceError: noneFn is not defined`。

```js
thunk(function (callback) {
  noneFn();
})(function (error, res) {
  // catch a error
  console.log(error, res); // [ReferenceError: noneFn is not defined] undefined
  noneFn();
})();
// none function to catch error, error will be throw.
// throw error: `ReferenceError: noneFn is not defined`
```

如上，第一个异常被捕获，第二个被抛出系统。第一个因为给 thunk 添加了数据接收体 `callback` 函数，thunks 当然认为 callback 会处理异常，所以把异常丢给 callback 处理。第二个，没有数据接收体，就把异常抛出系统了。如果是封装第三方 API，不知道后面有没有接收体，那么就应该像这样处理：

```js
var thunk = require('thunks')();

module.exports = function (arg, options)
  return Thunk(function (callback) {
    // do some thing, get error or result
    callback(error, result);
  })(function (error, res) {
    // 如果有异常，直接抛出，当然也可加工后抛出
    if (error) throw error;
    // 进一步加工 res
    return doSomeOther(res);
  });
};
```

更多可以参考 [thunk-redis](https://github.com/thunks/thunk-redis)，一个用 thunks 封装的原生 redis 客户端。

前面提到，“自行 `try catch` 异常” 是怎么回事，其实很简单：

```js
thunk(function (callback) {
  try {
    noneFn();
  } catch (err) {
    return callback(err);
  }
  return callback(null, 1);
})(function (error, res) {
  console.log(error, res); // [ReferenceError: noneFn is not defined] undefined
});
```

当然，这捕获的是同步函数的异常，如果是异步函数，那么请用 thunks 封装好再来。

最后看看 `generator` 函数中的异常处理，很简单的示例代码，自行理解：

```js
var thunk = require('../thunks.js')();

thunk(function* () {
  // catch error by yourself
  try {
    yield function (callback) { noneFn(); };
  } catch (err) {
    console.log('catched a error:', err);
  }

  yield function (callback) { throw new Error('some error'); };

})(function (error, res) {
  // catch the second error by Thunk
  console.log(error, res);

})(function* () {
  yield function (callback) { throw new Error('some error2'); };
})();
// throw error to system
// Error: some error2...
```

#### 以上相关代码在 `examples` 目录均可见，还包括更多使用示例。
