'use strict'
/*global module, process*/

var thunk = require('../thunks.js')()
var request = require('request')

var get = thunk.thunkify(request)

var urls = [
  'http://baidu.com',
  'http://weibo.com',
  'http://bing.com'
]

thunk(function *() {
  // sequential
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i]
    var res = yield get(url)
    console.log('%s -> %s', url, res[0].statusCode)
  }
})(function *() {
  // parallel
  var res = yield urls.map(function (url) {
    return get(url)
  })

  return res.map(function (r) {
    return r[0].statusCode
  })
})(function (error, res) {
  console.log(error, res)
})
