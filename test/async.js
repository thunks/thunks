'use strict'

const tman = require('tman')
const should = require('should')

module.exports = function (thunks) {
  tman.suite('thunk with async', function () {
    tman.it('yield any value', function (done) {
      const thunk = thunks()
      thunk(async function () {
        should(await Promise.resolve(1)).be.equal(1)
      })(done)
    })

    tman.it('thunks.isGeneratorFn', function () {
      should(thunks.isGeneratorFn(async function () {})).be.false()
    })

    tman.it('thunks.isAsyncFn', function () {
      should(thunks.isAsyncFn(function * () {})).be.false()
      should(thunks.isAsyncFn(async function () {})).be.true()
    })

    tman.it('thunks.isThunkableFn', function () {
      should(thunks.isThunkableFn(async function () {})).be.true()
    })
  })
}
