'use strict'
/*global describe, it*/

var should = require('should')
var thunks = require('../thunks.js')

describe('thunk with generator', function () {
  it('yield any value', function (done) {
    var thunk = thunks()

    thunk(function *() {
      should(yield 1).be.equal(1)
      should(yield null).be.equal(null)
      should(yield thunk(1)).be.equal(1)
      should(yield Promise.resolve(1)).be.equal(1)
      should(yield [1, 2, 3]).be.eql([1, 2, 3])
      should(yield [1, 2, thunk(3)]).be.eql([1, 2, 3])
      should(yield {}).be.eql({})
      should(yield {
        name: 'thunks',
        version: thunk('v2')
      }).be.eql({
        name: 'thunks',
        version: 'v2'
      })
      should(yield [{},
        [],
        [{}]
      ]).be.eql([{},
        [],
        [{}]
      ])

      should(yield function (callback) {
        callback(null, 1, 2, 3)
      }).be.eql([1, 2, 3])

      return yield [
          1,
          function (cb) {
            setTimeout(function () {
              cb(null, 2)
            })
          },
          thunk(3),
          Promise.resolve(4),
          thunk(function *() {
            return yield 5
          })
        ]
    })(function (err, res) {
      should(err).be.equal(null)
      should(res).be.eql([1, 2, 3, 4, 5])
    })(done)
  })

  it('catch error', function (done) {
    var thunk = thunks()
    var error = null
    thunk(function *() {
      try {
        yield function () {
          throw new Error('catch error 1')
        }
      } catch (err) {
        error = err
      }
      should(error).be.instanceOf(Error)
      should(error.message).be.equal('catch error 1')

      try {
        yield function *() {
          throw new Error('catch error 2')
        }
      } catch (err) {
        error = err
      }
      should(error).be.instanceOf(Error)
      should(error.message).be.equal('catch error 2')

      yield [1, Promise.reject(new Error('reject error')), 3]
    })(function (err, res) {
      should(err).be.instanceOf(Error)
      should(err.message).be.equal('reject error')
      should(res).be.equal(undefined)
    })(done)
  })

  it('call with context', function (done) {
    var thunk = thunks()
    var x = {}

    thunk.call(x, function *() {
      should(this).be.equal(x)
      return yield [
        function (callback) {
          should(this).be.equal(x)
          callback(null, 1)
        },
        [function (callback) {
          should(this).be.equal(x)
          callback(null, 1)
        }]
      ]
    })(function (err, res) {
      should(err).be.equal(null)
      should(res).be.eql([1, [1]])
    })(done)
  })

  it('nested yield and chained generator', function (done) {
    var thunk = thunks()

    thunk(function *() {
      should(yield function *() {
        return yield 1
      }).be.equal(1)

      return function *() {
        return yield [1, 2, 3, 4, 5]
      }
    })(function *(err, res) {
      should(err).be.equal(null)
      should(res).be.eql([1, 2, 3, 4, 5])
      should(yield res).be.eql([1, 2, 3, 4, 5])

      return (function *() {
        return yield [1, 2, 3, 4, 5]
      })()
    })(function *(err, res) {
      should(err).be.equal(null)
      should(res).be.eql([1, 2, 3, 4, 5])
    })(done)
  })

  it('nested yield 2', function (done) {
    var thunk = thunks()
    thunk(function *() {
      return yield [
          thunk.all([
            function *() {
              return yield 1
            }, (function *() {
              return yield 2
            }())
          ]),
          thunk.seq([
            function *() {
              return yield 3
            },
            (function *() {
              return yield 4
            }())
          ]),
          {
            a: thunk(5),
            b: yield 6
          }
        ]
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql([
        [1, 2],
        [3, 4],
        {a: 5, b: 6}
      ])
    })(done)
  })

  it('stop thunk', function (done) {
    var thunk = thunks()

    thunk(function *() {
      thunk.stop()
      should('It will not be run!').be.equal(true)
    })(function () {
      should('It will not be run!').be.equal(true)
    })

    thunk(function *() {
      try {
        yield function *() {
          thunk.stop()
          should('It will not be run!').be.equal(true)
        }
      } catch (e) {
        should('It will not be run!').be.equal(true)
      }
    })(function () {
      should('It will not be run!').be.equal(true)
    })
    done()
  })

  it('stop thunk with onstop', function (done) {
    var thunk = thunks({
      onstop: function (sig) {
        should(sig.message).be.equal('generator')
        done()
      }
    })
    var thunk2 = thunks()

    thunk2.delay(100)(function *() {
      try {
        yield function *() {
          thunk.stop('generator')
          should('It will not be run!').be.equal(true)
        }
      } catch (e) {
        should('It will not be run!').be.equal(true)
      }
    })(function () {
      should('It will not be run!').be.equal(true)
    })
  })

  it('generator in thunk.persist', function (done) {
    var x = {}
    var thunk = thunks()
    var test = thunk.persist(thunk(x))
    test(function *(error, value) {
      should(error).be.equal(null)
      should(value).be.equal(x)
      return yield test
    })(function (error, value) {
      should(error).be.equal(null)
      should(value).be.equal(x)
    })(done)
  })

  it('extremely yield (100000)', function (done) {
    var thunk = thunks()
    thunk(function *() {
      var result = 100000
      var i = result

      while (i--) result -= yield thunk(1)
      should(result).be.equal(0)
    })(done)
  })
})
