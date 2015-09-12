'use strict'
/*global */

var thunk = require('../thunks.js')({
  onstop: function (res) {
    if (res) console.log(res.code, res.status, res) // SIGSTOP 19 { message: 'Stop now!' }
  }
})

thunk(function (callback) {
  thunk.stop('Stop now!')
  console.log('It will not run!')
})(function (error, value) {
  console.log('It will not run!', error)
})

thunk.delay(100)(function () {
  console.log('Hello')
  return thunk.delay(100)(function () {
    thunk.stop('Stop now!')
    console.log('It will not run!')
  })
})(function (error, value) {
  console.log('It will not run!', error)
})
