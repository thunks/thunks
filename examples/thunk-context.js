'use strict'
/*global console*/

var thunk = require('../thunks.js')()

thunk.call({x: 123}, 456)(function (error, value) {
  console.log(error, this.x, value) // null 123 456
  return 'thunk!'
})(function (error, value) {
  console.log(error, this.x, value) // null 123 'thunk!'
})

thunk.all.call({x: [1, 2, 3]}, [4, 5, 6])(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] [4, 5, 6]
  return 'thunk!'
})(function (error, value) {
  console.log(error, this.x, value) // null [1, 2, 3] 'thunk!'
})
