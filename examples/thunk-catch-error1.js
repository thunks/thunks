'use strict'
/*global console, noneFn*/

var thunk = require('../thunks.js')()

thunk(function (callback) {
  noneFn()
})()
// none function to catch error, error will be throw.
// throw error: `ReferenceError: noneFn is not defined`
