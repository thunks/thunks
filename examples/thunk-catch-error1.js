'use strict'
/* global noneFn */

var thunk = require('..').thunk

thunk(function (callback) {
  noneFn()
})()
// none function to catch error, error will be throw.
// throw error: `ReferenceError: noneFn is not defined`
