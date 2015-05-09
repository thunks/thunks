有了 Promise 为什么还是需要 thunks
====

答复 @hax 的 https://github.com/hax/hax.github.com/issues/11#issuecomment-68478326

## 关于 release Zalgo

详细描述在这里 http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony ，简而言之，下面这个 demo 就是 release Zalgo：

```js
var cache = {};
function maybeSync(arg, callback) {
  if (cache[arg]) return callback(null, cache[arg]);

  fs.readFile(arg, function (err, data) {
    if (err) return callback(err);
    cache[arg] = data;
    callback(null, data);
  })
}
```
即 `callback` 可能同步执行也可能异步执行，防止 `release Zalgo(dezalgo)` 即把

```js
if (cache[arg]) return callback(null, cache[arg]);
```

强制转换成异步执行，如：

```js
if (cache[arg]) return process.nextTick(function() {
  callback(null, cache[arg]);
});
```

那么 `release Zalgo` 会有什么问题呢？文章中举例同步锁问题，但我个人认为那是程序写法有问题，我从来不会那么写。我遇见的问题可能就是 Zalgo API 可能导致一些异步库出现 `Maximum call stack size exceeded`，比如 `co` v3 就不应该就接受 Zalgo API。`thunks` 则不会受 Zalgo API 的困扰。

## 关于 thenjs

经测试，thenjs 在以下同步模式中确实出现 `Maximum call stack size exceeded`：

```js
function nextThen(cont, res) {
  // 如果这里是异步，则不会出错，
  return cont(null, res + Math.random());
}

var thenjs = Thenjs(0);
for (var i = 0; i < 10000; i++) thenjs = thenjs.then(nextThen);
```

之前确实未考虑通过 `then` 链来处理上千的同步顺序逻辑。这类需求一般用 `thenjs.series` 来处理的话，不管同步还是异步，都不会出错。

当时写 thenjs 纯粹为了方便异步流程控制，那时候我接触的 Promise 还是老式的 `var deferred = Q.defer()` 形式，像裹脚布一样，我不喜欢。由于异步流程控制主要用于 node.js，我便选择了 callback 形式，结合 then 链，后又融合了 `async` 的主要 API。thenjs 结合 node.js 原生的 callback API，写异步流程控制是非常方便的，运行速度也是极快的。

但它的缺点正如 @hax 所说，Promise 的 then 大行其道的时候，thenjs 的 then 就不标准了，可能会导致第三方库无法辨识。所以 thenjs 也只适合做异步流程控制，不适合用于异步 API，因为第三方库不会对它封装的 API 做兼容（只有 thenjs 自己和 thunks 能识别 thenjs 封装的 API）。

那么 thenjs 还好用吗？在 promise API 还未大量普及的时候，如果你喜欢 callback 风格，如果你追求极致速度，那么就放心的使用。对于偏向  callback 风格的我建议使用 thunks 进行流程控制，否则就使用 `bluebird` 之类的 Promise 库，原生 Promise 是不适合用作流程控制的。

## 关于 Promise

Promise 的最大优势是标准，各类异步工具库都认同，未来的 async/await 也基于它，用它封装 API 通用性强，用起来简单。thunks 也完全支持 Promise 封装的 API，所以如果 node.js 的异步 API 全部转 promise，thunks 也是无缝对接。

在我的认识中，Promise 不仅仅是统一了异步接口（用于封装 API），它更强大的地方应该是组合能力，像搭积木一样，将各种各样的异步 API 调用组合成一个简单的新 promise。所以，我对它的期望变得更高：它应该是一个完美的异步流程工具，但显然，原生 Promise 无法胜任这一角色。如果要用 promise 做异步流程控制，必须引入第三方 Promise 库（那么引入 bluebird 与引入 thunks 又有何区别？后者更小巧更强大）

原生 Promise 无法胜任异步流程管理的理由：

1. 缺乏 debug 机制，在一个复杂的异步流程中，很难追踪出问题的点；
2. 缺乏语法糖 API，如 sequence 队列，promiseify，delay 之类，在业务场景中都是很有用的东西，原生 Promise 显然不会加入这些东西；
3. 缺乏 generator 支持，无疑，用 generator/yield 书写异步流程简单优美，用上了就再也丢不掉，原生 Promise 显然也不会加入这些东西；
4. 缺乏自定义 context 支持，如果熟悉了 koa 便知道，支持自定义 context 的异步库写异步业务将是多么简洁优美；

总之，原生 Promise 的定位就是提供基础的异步能力，没有更多。

## 关于 thunks

再来看看最纯粹的 `thunk` 的定义：

**一个封装了业务逻辑的函数，它接受唯一一个参数`callback`，当业务逻辑执行完毕会调用这个`callback`，它的第一个参数是 error，第二个往后的参数是业务逻辑执行结果**

一个简单的 demo 如下：
```js
//假设 fs.readFile 返回 thunk
var thunk = fs.readFile('./package.json');
thunk(function(err, file) {
  console.log(err, file);
});
```

或者直接简化为
```js
//假设 fs.readFile 返回 thunk
fs.readFile('./package.json')(function(err, file) {
  console.log(err, file);
});
```

有两点需要注意：

1. 纯粹的 `thunk` 并不依赖 [thunks](https://github.com/thunks/thunks) 库，也不依赖任何其它东西，node.js 诞生之初完全可以将异步 API 设计成返回 thunk 的形式（那么，当时为什么没有这么做呢？）
2. `thunk` 是惰性求值的，也就是说 `thunk = fs.readFile('./package.json')` 并没有开始读文件，调用 `thunk(callback)` 后才开始读文件的，这一点与现有的 node.js API `fs.readFile('./package.json', callback)` 并无区别。而 `promise` 是及早求值的，如执行 `promise = fs.readFile('./package.json')` 时就已经开始读文件了。

从统一异步接口的角度来看，thunk 也具有高度的一致性，相对 promise，它更简单，纯函数天然支持，无需额外的 Promise 实现。

另外 async/await 既然支持 promise，那么支持 thunk 也应该毫无压力。

它唯一缺的就是异步组合能力（但底层 API 不需要依赖这个来输出 thunk），这就是 thunks 所做的事。

thunks 把 Promise 的异步组合能力融入了 thunk，可以像组合 promise 一样来组合 thunk 函数。更进一步的是，thunks 不仅仅能组合 thunk 函数，还能组合 promise、generator 甚至一般值。简而言之，thunks 能组合一切，不管是同步还是异步，不管是 thunk、 promise、generator还是其它。具体可参阅 API 和 examples。

我渴望的 node.js 的美好场景是，底层异步 API（如 fs模块、redis 客户端等）输出纯粹的 thunk 函数，而用户业务层 API 则基于 thunks 输出 thunk 函数。

当然，现实中 node.js 还是提供着 `readFile(arg, callback)` 之类的缺乏一致性的原始 API，而社区群众呼吁的却是 promise API。thunks 也不担心这些，thunks 通吃这两类 API。

### 关于 @hax 提的几个问题：

1. releasing Zalgo 和 Maximum call stack size exceeded，thunks 已经不存在这个问题了，thunks 不害怕 releasing Zalgo API 爆栈。
2. promise 的 then 可多次调用，而 thunks 的 thunk 只能调用一次。用两个比喻：一，我让张三去打一桶水，张三打了水交给我，我再次找张三要他还能交给我一桶水？二，我让李四临摹一副蒙拉丽莎，李四完成后交给我，我再找他要他还能立即给我一副？所以，在我看来，then 的可重复调用真的不符合逻辑，即便有这种逆天需求，也应该是用户实现，而不是基础库实现。再比如用 promise.then，函数 A 从中取了一个对象 `{}`，并做了修改，函数 B 再从这个 then 中取值，那么 B 期待的数据是已修改的还是未修改的呢？
3. thunk 函数中 `return` 函数的问题，的确，thunks 会把返回的函数当做 thunk 函数或 generator 函数处理，如果 `return` 了一个不符合 thunk 函数格式的普通函数，就会出问题。如果要返回函数，只能放在包在数组或对象中了。我目前还没有接触过这类需求。


先写到这里，后面想到了再完善。总而言之，Promise 强势崛起的时候，thunks 只会强调自己是一个强大的异步流程管理库，能完美处理 promise API。当然，我更期望 （纯粹的）thunk 也能成为一个标准的异步 API 接口，获得 ES 的原生支持。
