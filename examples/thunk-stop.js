'use strict'
/*global */

var thunk = require('../thunks.js')({
  debug: function (res) {
    if (res) console.log(res) // { [Error: Stop now!] code: {}, status: 19 }
  }
})

thunk(function (callback) {
  thunk.stop('Stop now!')
  console.log('It will not be run!')
})(function (error, value) {
  console.log('It will not be run!', error)
})

thunk.delay(100)(function () {
  console.log('Hello')
  return thunk.delay(100)(function () {
    thunk.stop('Stop now!')
    console.log('It will not be run!')
  })
})(function (error, value) {
  console.log('It will not be run!', error)
})
