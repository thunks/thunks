'use strict'

// `ts-node examples/simple.ts`

import * as assert from 'assert'
import { thunk, thunks, isGeneratorFn } from '../'
// or: import * as thunks from 'thunks'

thunk(function * () {
  assert.strictEqual(yield thunks()(1), 1)
  assert.ok(isGeneratorFn(function * () {}))

  while (true) {
    yield function (done) { setTimeout(done, 1000) }
    console.log('Dang!')
  }
})()
