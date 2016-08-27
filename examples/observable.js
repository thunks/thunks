'use strict'

var fs = require('fs')
var Rx = require('rxjs')
var thunk = require('../thunks.js')()

thunk(function * () {
  console.log('1. yield Rx.Observable', yield Rx.Observable.fromPromise(Promise.resolve(123)))
  console.log('2. yield Rx.Observable', yield Rx.Observable.bindNodeCallback(fs.stat)('thunks.js'))

  try {
    yield Rx.Observable.fromPromise(Promise.reject(new Error('some error')))
  } catch (err) {
    console.log('3. catch Rx.Observable error', err)
  }
})()
