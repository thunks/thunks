'use strict'
/*global console, noneFn*/

var thunk = require('../thunks.js')(function (error) {
  // any error will be catched by this function
  console.log('catched error: ', error)
  // catched error:  [ReferenceError: noneFn is not defined]
  // catched error:  [Error: error]
  // catched error:  [Error: error2]
})

thunk(function (callback) {
  noneFn()
})(function (error, res) {
  // this function will not be run.
  console.log(error, res)
  noneFn()
})()

thunk(function (callback) {
  throw new Error('error')
})(function (error, res) {
  // this function will not be run.
  console.log(error, res)
  noneFn()
})()

thunk(1)(function (error, res) {
  console.log(error, res) // null 1
  return thunk(function () { throw new Error('error2') })
})()
