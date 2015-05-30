'use strict'
/*global module, process*/

var thunk = require('../thunks.js')()
var request = require('request')
var get = thunk.thunkify.call(request, request.get)

// measure response time N times
function * latency (url, times) {
  var ret = []

  while (times--) {
    var start = new Date()
    yield get(url)
    ret.push(new Date() - start)
  }

  return ret
}

thunk(function *() {
  // run each test in sequence
  var a = yield latency('http://baidu.com', 5)
  console.log(a)

  var b = yield latency('http://github.com', 5)
  console.log(b)

  var c = yield latency('http://weibo.com', 5)
  console.log(c)

})(function *() {
  // run each test in parallel, order is retained
  var a = latency('http://baidu.com', 5)
  var b = latency('http://github.com', 5)
  var c = latency('http://weibo.com', 5)

  return yield [a, b, c]
})(function (error, res) {
  console.log(error, res)
})
