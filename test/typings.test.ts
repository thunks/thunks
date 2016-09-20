'use strict'

// `tman -r ts-node/register test/typings.test.ts`

/// <reference path='../typings/index.d.ts' />

import * as assert from 'assert'
import { suite, it } from 'tman'
import * as thunks from '../'
import {thunk, thunks as thunksAlias, isThunkableFn, Scope} from '../'

suite('thunks typings', () => {
  it('thunks exports', function () {
    assert.strictEqual(thunks.NAME, 'thunks')
    assert.ok(typeof thunks.VERSION, 'string')
    assert.strictEqual(thunks.pruneErrorStack, true)
    assert.strictEqual(thunks.isGeneratorFn(function * () {}), true)
    assert.strictEqual(thunks.isThunkableFn(function * () {}), true)
    assert.strictEqual(thunks.isThunkableFn(function (done) { done() }), true)
    assert.strictEqual(thunks.isAsyncFn(function (done) { done() }), false)
    assert.strictEqual(thunks, thunksAlias)
    assert.strictEqual(thunks.Scope, Scope)
    assert.strictEqual(thunks.isThunkableFn, isThunkableFn)

    return thunk(1)(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
    })
  })

  it('thunks(options)', function () {
    assert.ok(typeof thunks(), 'function')
    assert.ok(typeof thunks(function (err) {}), 'function')
    assert.ok(typeof thunks({onerror: function (err) {}}), 'function')

    assert.ok(typeof thunks(new thunks.Scope()), 'function')
    assert.ok(typeof thunks(new thunks.Scope(function (err) {})), 'function')
    assert.ok(typeof thunks(new thunks.Scope({onerror: function (err) {}})), 'function')

    assert.ok(typeof thunksAlias(new Scope()), 'function')
    assert.ok(typeof thunksAlias(new Scope(function (err) {})), 'function')
    assert.ok(typeof thunksAlias(new Scope({onerror: function (err) {}})), 'function')
  })

  it('thunk(void)', function () {
    let thunk = thunks()
    return thunk()(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, undefined)
    })(function (err) {
      assert.strictEqual(err, null)
    })(function () {})()() // alway return ThunkFunction
  })

  it('thunk(boolean)', function () {
    let thunk = thunks()
    return thunk(false)(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, false)
    })
  })

  it('thunk(number)', function () {
    let thunk = thunks()
    return thunk(1)(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
    })
  })

  it('thunk(string)', function () {
    let thunk = thunks()
    return thunk('hello')(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 'hello')
    })
  })

  it('thunk(Array)', function () {
    let thunk = thunks()
    return thunk([1, '2'])(function (err, res) {
      assert.strictEqual(err, null)
      assert.deepEqual(res, [1, '2'])
    })
  })

  it('thunk(Object)', function () {
    let thunk = thunks()
    let date = new Date()
    return thunk(date)(function (err, res: Date) {
      assert.strictEqual(err, null)
      assert.strictEqual(res.toString(), date.toString())
    })
  })

  it('thunk(ThunkLikeFunction)', function * () {
    let thunk = thunks()

    yield thunk(function (done) {
      done(new Error('some error'))
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })

    yield thunk(function (done: (err?: Error, res?: Object) => void) {
      done(new Error('some error'))
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })

    yield thunk(function (done: (err?: Error, res?: Object) => void) {
      done()
    })

    yield thunk(function (done: (err?: Error, res?: Object) => void) {
      done(null)
    })

    yield thunk(function (done: (err?: Error, res?: Object) => void) {
      done(null, new Error('value'))
    })
  })

  it('thunk(GeneratorFunction)', function () {
    let thunk = thunks()
    return thunk(function * () {
      yield function (done) { setTimeout(done, 10) }
      return 1
    })(function * (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
      throw new Error('some error')
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })
  })

  // TS will transform async function to generator function, but it is not good to recognize.
  // babel do it better than TS.
  // it('thunk(AsyncFunction)', function () {
  //   let thunk = thunks()
  //   return thunk(async function () {
  //     await Promise.resolve()
  //     return 1
  //   })(function (err, res) {
  //     assert.strictEqual(err, null)
  //     assert.strictEqual(res, 1)
  //   })
  // })

  it('thunk(PromiseLike)', function () {
    let thunk = thunks()
    return thunk({then: function (resolve, reject) { resolve(1) }})(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
      return {then: function (resolve, reject) { reject(new Error('some error')) }}
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })
  })

  it('thunk(Promise)', function () {
    let thunk = thunks()
    return thunk(Promise.resolve(1))(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
      return Promise.reject(new Error('some error'))
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })
  })

  it('thunk(ToThunk)', function () {
    let thunk = thunks()
    return thunk({toThunk: function () { return function (done) { done(null, 1) } }})(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
      return {toThunk: function () { return function (done) { done(new Error('some error'), 1) }}}
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })
  })

  it('thunk(ToPromise)', function () {
    let thunk = thunks()
    return thunk({toPromise: function () { return Promise.resolve(1) }})(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
      return {toPromise: function () { return Promise.reject(new Error('some error')) }}
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })
  })

  it('thunk(Generator)', function () {
    let thunk = thunks()
    return thunk((function * () { return yield 1 })())(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
      return (function * () { throw new Error('some error') })()
    })(function (err, res) {
      assert.strictEqual(err.message, 'some error')
      assert.strictEqual(res, undefined)
    })
  })

  suite('thunk method', function () {
    let thunk = thunks()

    it('thunk.all(...args)', function () {
      return thunk.all(thunk(1), Promise.resolve(2))(function (err, res) {
        assert.strictEqual(err, null)
        assert.deepEqual(res, [1, 2])
      })
    })

    it('thunk.all(array)', function () {
      return thunk.all([thunk(1), Promise.resolve(2)])(function (err, res) {
        assert.strictEqual(err, null)
        assert.deepEqual(res, [1, 2])
      })
    })

    it('thunk.all(object)', function () {
      return thunk.all({a: thunk(1), b: Promise.resolve(2)})(function (err, res) {
        assert.strictEqual(err, null)
        assert.deepEqual(res, {a: 1, b: 2})
      })
    })

    it('thunk.seq(...args)', function () {
      return thunk.seq(thunk(1), Promise.resolve(2))(function (err, res) {
        assert.strictEqual(err, null)
        assert.deepEqual(res, [1, 2])
      })
    })

    it('thunk.seq(array)', function () {
      return thunk.seq([thunk(1), Promise.resolve(2)])(function (err, res) {
        assert.strictEqual(err, null)
        assert.deepEqual(res, [1, 2])
      })
    })

    it('thunk.race(...args)', function () {
      return thunk.race(thunk(1), Promise.resolve(2))(function (err, res) {
        assert.strictEqual(err, null)
        assert.strictEqual(res, 1)
      })
    })

    it('thunk.race(array)', function () {
      return thunk.race([thunk(1), Promise.resolve(2)])(function (err, res) {
        assert.strictEqual(err, null)
        assert.strictEqual(res, 1)
      })
    })

    it('thunk.persist(thunkable)', function () {
      return thunk.persist(thunk(1))(function (err, res) {
        assert.strictEqual(err, null)
        assert.strictEqual(res, 1)
      })
    })

    it('thunk.thunkify(fn)', function * () {
      let test0 = function (done: (err?: Error, ...args: Array<any>) => void) {
        done(null, 1, 2, 3)
      }
      let fn0 = thunk.thunkify(test0)
      assert.deepEqual(yield fn0(), [1, 2, 3])

      let test1 = function (val: string, done: (err?: Error, ...args: Array<string>) => void) {
        done(null, val)
      }
      let fn1 = thunk.thunkify(test1)
      assert.strictEqual(yield fn1('test'), 'test')

      let test2 = function (val1: any, val2: any, done) {
        done()
      }
      let fn2 = thunk.thunkify(test2)
      assert.strictEqual(yield fn2('test', 0), undefined)

      let test3 = function (val1: any, val2: any, val3: number, done) {
        done(null, val1, val2, val3)
      }
      let fn3 = thunk.thunkify(test3)
      assert.deepEqual(yield fn3(null, false, 0), [null, false, 0])
    })

    it('thunk.lift(fn)', function () {
      let test = function (a, b) { return a + b }
      let fn = thunk.lift(test)
      return fn(thunk(1), Promise.resolve(2))(function (err, res) {
        assert.strictEqual(err, null)
        assert.strictEqual(res, 3)
      })
    })

    it('thunk.delay(number)', function () {
      return thunk.delay(100)(function (err, res) {
        assert.strictEqual(err, null)
        assert.strictEqual(res, undefined)
      })
    })
  })

  it('thunk.stop(message)', function (done) {
    let thunk = thunks({
      onstop: function (sig) {
        assert.strictEqual(sig.message, 'stop!')
        assert.strictEqual(sig.status, 19)
        assert.strictEqual(sig.code, 'SIGSTOP')
        done()
      }
    })

    thunk(1)(function (err, res) {
      assert.strictEqual(err, null)
      assert.strictEqual(res, 1)
      thunk.stop('stop!')
    })(function () {
      assert.strictEqual('should not run', false)
    })
  })

  it('thunk.cancel()', function (done) {
    let thunk = thunks()
    thunk.seq(thunk.delay(10), thunk.delay(10), thunk.delay(10))(function () {
      assert.strictEqual('should not run', false)
    })

    setTimeout(thunk.cancel, 10)
    setTimeout(done, 100)
  })
})
