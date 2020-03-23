'use strict'

var thunks = require('..')
var thunk = thunks()

thunk(function () {})(function (err) {
  console.log(1, err) // 1 [Error: Not thunkable function: function () {}]
})

thunk(function (a, b) {})(function (err) {
  console.log(2, err) // 2 [Error: Not thunkable function: function (a, b) {}]
})

thunk(function () { const callback = arguments[0]; callback() })(function (err) {
  console.log(3, err) // 3 [Error: Not thunkable function: function () { let callback = arguments[0]; callback() }]
})

thunk()(function () {
  return function () {} // can't return a not thunkable function.
})(function (err) {
  console.log(4, err) // 4 [Error: Not thunkable function: function () {}]
})
