Promise 的及早求值 vs thunks 的惰性求值
====
thunks 的异步编程模式模仿了 Promise，实际上 thunks 诞生之初的目标就是想用纯函数实现 Promise 的功能。随着代码的不断优化和越来越多的功能引入，thunks 已完全超越 Promise，Promise 能实现的业务逻辑，thunks 都能实现，而 thunks 能实现的很多功能，Promise 却无能为力，更重要的是，thunks 能完美处理 Promise。

thunk 是什么？在《Haskell趣學指南》中，thunk 被翻译成 [**保证**](http://learnyouahaskell-zh-tw.csie.org/zh-cn/input-and-output.html)，而在《Haskell 函数式编程入门》的最后章节（15.3.2），thunk 描述如下：
> thunk 意为形实替换程序（有时候也称为延迟计算，suspended computation）。它指的是在计算的过程中，一些函数的参数或者一些结果通过一段程序来代表，这被称为 thunk。可以简单地把 thunk 看做是一个未求得完全结果的表达式与求得该表达式结果所需要的环境变量组成的函数，这个表达式与环境变量形成了一个无参数的闭包（parameterless closure），所以 thunk 中有求得这个表达式所需要的所有信息，只是在不需要的时候不求而已。

以上描述可以看出，thunk 必定是惰性求值的。而 [thunks](https://github.com/thunks/thunks) 的实现也与 haskell 中的 thunk 含义一致。

及早求值和惰性求值是 Promise 与 thunks 的根本性区别之一。那么这个区别在实际应用场合中会有影响吗？毕竟普通场合下用起来都差不多。

下面就给出一个受 Promise 的及早求值限制而难以实现的应用场景。首先，用示例看看及早求值和惰性求值的区别。

我使用了 [thunk-redis](https://github.com/thunks/thunk-redis) 来做示例，因为它同时支持输出 thunk API 和 promise API。

**Promise 的及早求值：**
```js
var redis = require('thunk-redis');
var client = redis.createClient({usePromise: true});

var infoPromise = client.info();
// 这里，info command 已经向 redis server 发出，已经开始异步求值。

infoPromise.then(function(info) {
  console.log(info);
}).catch(function(err) {
  console.error(err);
});
```

**thunks 的惰性求值：**
```js
var redis = require('thunk-redis');
var client = redis.createClient();

var infoThunk = client.info();
// 这里，info command 请求还封装在 infoThunk 函数内，没有向 redis server 发出请求。

infoThunk(function(err, info) {
  if (err) return onsole.error(err);
  console.log(info);
});
// 执行 infoThunk 函数才会向 redis server 发出请求，进行异步求值。
```

可以看到，当我们获得一个 `promise` 的时候，它内部的异步任务已经启动。而当我们获得一个 `thunk` 函数的时候，
它内部的异步任务没有启动，在我们需要的时候手动执行，不需要的话就不必管了。而 `promise` 就由不得你了，不管你要不要，它已经执行。

我们来看看一个实际应用场景：

```js
/**
* 更新 issue 内容（不包括置顶、阅读计数、标签、点赞、对象关联、评论），并后台同步到 mongodb
*
* @param {Object} issue
*
* @return {Boolean}
* @api public
*/
exports.updateIssue = function*(issueObj) {
  // 将 issue 更新内容转化为 redis 格式（redis 为主数据库）
  var issue = parseIssueTo(issueObj);
  // 将 redis transaction 启动命令推入任务队列
  var tasks = [client.multi()];
  if (issue.title || issue.content) {
    // 如果更新内容包含 title 或 content，则需要同时更新 issue 的活跃统计
    // 先读取原文的 title 和 content 用作修改对比
    var value = yield client.hmget(issueKey(issueObj._id), 'title', 'content');
    // 未读到 issue 则说明它不存在，请求数据有问题
    if (!value.length) tools.throw(404, 'issue "' + issueObj._id + '" is not exist');
    // 作比较，未更新则删除
    if (issue.title === value[0]) delete issue.title;
    if (issue.content === value[1]) delete issue.content;
    // 有更新则将活跃统计更新任务推入队列
    if (issue.title || issue.content) {
      var activedAt = new Date();
      issue.activedAt = JSON.stringify(activedAt);
      tasks.push(client.zadd(activeZSets, +activedAt, issueObj._id));
    }
    // 若不涉及 title 或 content，则直接判断 issue 是否存在
  } else yield isIssueExists(issueObj._id);
  // 空数据不处理（如原传入了 content 但发现没改变），直接返回
  if (_.isEmpty(issue)) return false;
  // 将数据更新任务推入队列
  tasks.push(client.hmset(issueKey(issueObj._id), issue));
  tasks.push(client.exec());
  // 如果是 promise API，上面队列中的任务都已经开始执行
  // 如果是 thunk API，则还没有执行，`yield tasks`才真正开始执行
  var res = yield tasks;
  // client.exec() 响应不为 null则表明执行成功，将更新同步到 mongodb
  res = !!res[tasks.length - 1];
  if (res) Thunk(mongoIssue.findByIdAndUpdate(issueObj))();
  return res;
};
```
这是从用户社区系统的 DAO 操作模块抽取的一段，我添加了一些注释。它是用 [Toa](https://github.com/toajs/toa) 构建的系统(开发中)。

这只是一个相对简单的场景。采用 thunk API，我们可以按照逻辑获取一个一个异步任务的 thunk，按顺序推入任务队列，中间若有出错可以直接退出。当一切准备好，我们才真正开始执行这个异步任务队列。

如果采用 promise API，我们必须先把相关的一切准备好，如解析请求、读取数据、对比数据等，再根据准备结果构建不同的 promise 任务队列，最后的 `yield tasks` 将只是等待队列中的所有 promise 完成。我们不能提前取得任何一个任务的 promise，因为一旦取得，这个任务就开始执行了，无法取消~

虽然 promise 和 thunk 都是 “保证”，但实际应用场景需要的保证应该更像后者：先拿到一个“保证”，当需要时就可以按预期执行，不需要则直接丢弃；而不应该像前者，拿到这个“保证”时它就已经执行了，不管是不是真正需要。
