'use strict'

// `ts-node examples/simple.ts`

import * as thunks from '../'
const thunk = thunks()

thunk(function * () {
  while (true) {
    yield function (done) { setTimeout(done, 1000) }
    console.log('Dang!')
  }
})()
