'use strict'
/*global console, noneFn*/

var thunk = require('../thunks.js')(function (error) {
  // any error will be catched by this function
  console.log('catched error: ', error)
  // catched error:  [ReferenceError: noneFn is not defined]
  // catched error:  [ReferenceError: noneFn is not defined]
  // catched error:  [Error: error]
  // catched error:  [Error: error2]
  return true // ignore error, continue to run other functions
})

thunk(function (callback) {
  noneFn()
  callback(null, 1)
})(function (error, res) {
  // this function will be run.
  console.log(error, res) // null undefined
  noneFn()
})()

thunk(function (callback) {
  throw new Error('error')
})(function (error, res) {
  // this function will be run.
  console.log(error, res) // null undefined
})()

thunk(1)(function (error, res) {
  console.log(error, res) // null 1
  return thunk(function () { throw new Error('error2') })
})()
