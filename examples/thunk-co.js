'use strict'
/*global console*/

var thunk = require('../thunks.js')()
var co = require('co')

var thunkFn = thunk(function (callback) {
  setTimeout(function () { callback(null, 1) })
})

co(function *() {
  var a = yield thunkFn
  return yield [a, thunk(2), thunk(function (callback) {
      setTimeout(function () { callback(null, 3) })
    })]
})(function (error, value) {
  console.log(error, value) // null [1, 2, 3]
})

thunk(123)(function (err, res) {
  console.log(err, res) // null, 123
  return Promise.resolve(456)
})(function (err, res) {
  console.log(err, res) // null, 456
  return co(function *() {
    return yield [thunk('a'), Promise.resolve('b')]
  })
})(function (err, res) {
  console.log(err, res) // null, ['a', 'b']
})
