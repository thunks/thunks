'use strict'

var thunks = require('..')
var thunk = thunks()

thunk()(function () {
  throw new Error('111111')
})
