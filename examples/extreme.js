'use strict'
/*global module, process*/

var thunk = require('../thunks.js')()
var thunkFn = thunk(0)

function callback (error, value) {
  if (error != null) throw error
  return ++value
}
// No `Maximum call stack size exceeded` error in 10000000 sync series
console.time('thunk_series')
for (var i = 0; i < 10000000; i++) {
  thunkFn = thunkFn(callback)
}
thunkFn(function (error, value) {
  console.log(error, value) // null, 10000000
  console.timeEnd('thunk_series') // ~9130ms
})

console.log('thunk.delay 500: ', Date.now())
thunk.delay(500)(function () {
  console.log('thunk.delay 1000: ', Date.now())
  return thunk.delay(1000)
})(function () {
  console.log('thunk.delay end: ', Date.now())
})
