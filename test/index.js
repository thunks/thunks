'use strict'
/*global noneFn*/

var tman = require('tman')
var should = require('should')
var thenjs = require('thenjs')
var thunks = require('..')
var x = {}

tman.suite('thunks', function () {
  tman.suite('thunks()', function () {
    tman.it('thunks(onerror) 1', function (done) {
      var thunk = thunks(function (error) {
        should(error).be.instanceOf(Error)
        should(error.message).be.equal('some error!')
        done()
      })

      thunk()(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(undefined)
        throw new Error('some error!')
      })(function () {
        should('this function will not run').be.equal(true)
      })
    })

    tman.it('thunks(onerror) 2', function (done) {
      var thunk = thunks(function (error) {
        should(error).be.instanceOf(Error)
        should(error.message).be.equal('some error 2!')
        done()
      })

      thunk()(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(undefined)
        throw new Error('some error 2!')
      })
    })

    tman.it('thunks(onerror) [return true]', function (done) {
      var thunk = thunks({
        onerror: function (error) {
          should(error).be.instanceOf(Error)
          should(error.message).be.equal('some error and continue!')
          return true
        }
      })

      thunk()(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(undefined)
        throw new Error('some error and continue!')
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(undefined)
        done()
      })
    })

    tman.it('thunks({onerror: onerror})', function (done) {
      var thunk = thunks({
        onerror: function (error) {
          should(error).be.instanceOf(Error)
          should(error.message).be.equal('some error!')
          done()
        }
      })
      thunk(x)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        throw new Error('some error!')
      })(function () {
        throw new Error('this function will not run')
      })
    })

    tman.it('thunks({onstop: onstop})', function (done) {
      var thunk = thunks({
        onstop: function (sig) {
          should(sig).not.be.instanceOf(Error)
          should(sig.status).be.equal(19)
          should(sig.code).be.equal('SIGSTOP')
          should(sig.message).be.equal('stop')
          done()
        }
      })
      thunk(x)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        thunk.stop('stop')
        should('It will not run!').be.equal('')
      })(function () {
        should('It will not run!').be.equal('')
      })
    })

    tman.it('thunks({onstop: onstop}) in nested', function (done) {
      var thunk = thunks({
        onstop: function (sig) {
          should(sig.message).be.equal('nested')
          done()
        }
      })
      var thunk2 = thunks()
      thunk2(x)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        thunk.stop('nested')
        should('It will not run!').be.equal('')
      })(function () {
        should('It will not run!').be.equal('')
      })
    })

    tman.it('thunks({debug: debug})', function (done) {
      var _debug = null
      var thunk = thunks({
        debug: function () {
          _debug = arguments
        }
      })
      thunk(x)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        should(_debug[0]).be.equal(null)
        should(_debug[1]).be.equal(x)
        throw new Error('some error!')
      })(function (error, value) {
        should(error).be.instanceOf(Error)
        should(error.message).be.equal('some error!')
        should(value).be.equal(undefined)
        should(_debug[0]).be.equal(error)
        should(_debug.length).be.equal(1)
      })(done)
    })

    tman.it('Throw err while fill repeatedly', function (done) {
      var thunk = thunks()
      var thunkFn = thunk(1)
      thunkFn(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(1)
      })
      should(function () {
        thunkFn()
      }).throw('The thunk already filled')
      should(function () {
        thunkFn(function () {})
      }).throw('The thunk already filled')
      done()
    })

    tman.it('Throw err while fill with non function', function (done) {
      var thunk = thunks()
      should(function () {
        thunk(1)('abc')
      }).throw()
      should(function () {
        thunk(1)([])
      }).throw()
      should(function () {
        thunk(1)({})
      }).throw()
      done()
    })
  })

  tman.suite('thunk()', function () {
    tman.it('thunk(value)', function (done) {
      var thunk = thunks()
      thunk(1)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(1)
        return 2
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(2)
        return thunk(x)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
      })(done)
    })

    tman.it('thunk(thunkFn)', function (done) {
      var thunk = thunks()
      thunk(thunk(x))(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        return thunk(thunk(thunk(function (callback) {
          callback(null, 1, x)
        })))
      })(function (error, value) {
        should(error).be.equal(null)
        should(value[0]).be.equal(1)
        should(value[1]).be.equal(x)
        should(arguments.length).be.equal(2)
      })(done)
    })

    tman.it('thunk(function)', function (done) {
      var thunk = thunks()
      var thunkFn1 = thunk(function (callback) {
        callback(null, 1)
      })
      var thunkFn2 = thunkFn1(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(1)
        return 2
      })
      var thunkFn3 = thunkFn2(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(2)
        return thunk(function (callback) {
          setImmediate(function () {
            callback(null, x)
          })
        })
      })
      thunkFn3(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        return thunk(function (callback) {
          setImmediate(function () {
            callback(false, true)
          })
        })
      })(function (error, value) {
        should(error).be.equal(false)
        should(value).be.equal(undefined)
        return thunk(function (callback) {
          callback(null, 1, 2, 3, x)
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value[0]).be.equal(1)
        should(value[1]).be.equal(2)
        should(value[2]).be.equal(3)
        should(value[3]).be.equal(x)
        should(arguments.length).be.equal(2)
        return thunk(function (callback) {
          setImmediate(function () {
            callback(null, 1)
          })
        })(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(1)
          return value * 2
        })(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(2)
          return thunk(function (callback) {
            setImmediate(function () {
              callback(null, value * 2)
            })
          })
        })(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(4)
          return value * 2
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(8)
        return thunk(thunk(value * 2))
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(16)
        return thunk(function (callback) {
          callback(null, 1)
          callback(null, 2)
        })(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(1)
        })
      })(done)
    })

    tman.it('thunk(non-thunk-function)', function (done) {
      function nonThunk1 () {}
      function nonThunk2 (a, b) {}

      var thunk = thunks()
      thunk(nonThunk1)(function (err) {
        should(err).be.instanceOf(Error)
        should(err.message).containEql('Not thunk function')
        should(err.message).containEql('nonThunk1')
        return thunk(nonThunk2)(function (err) {
          should(err).be.instanceOf(Error)
          should(err.message).containEql('Not thunk function')
          should(err.message).containEql('nonThunk2')
        })
      })(done)
    })

    tman.it('thunk(promise)', function (done) {
      var thunk = thunks()
      if (typeof Promise === 'function') {
        thunk(Promise.resolve(x))(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(x)
          return thunk(Promise.reject(new Error('some error!')))
        })(function (error, value) {
          should(error).be.instanceOf(Error)
          should(error.message).be.equal('some error!')
          should(value).be.equal(undefined)
          return new Promise(function (resolve, reject) {
            setImmediate(function () {
              resolve(x)
            })
          })
        })(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(x)
        })(done)
      } else {
        done()
      }
    })

    tman.it('thunk(toThunk)', function (done) {
      var thunk = thunks()
      thunk(thenjs(x))(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        return thunk(thenjs(function (cont) {
          throw new Error('some error!')
        }))
      })(function (error, value) {
        should(error).be.instanceOf(Error)
        should(error.message).be.equal('some error!')
        should(value).be.equal(undefined)
        return thenjs(function (cont) {
          setImmediate(function () {
            cont(null, x)
          })
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
      })(done)
    })

    tman.it('thunk.call()', function (done) {
      var thunk = thunks()
      thunk.call(x, 1)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(1)
        should(this).be.equal(x)
        return value * 2
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(2)
        should(this).be.equal(x)
        return thunk(10)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(10)
        should(this).be.equal(x)
      })(done)
    })

    tman.it('thunk() lazy evaluation', function (done) {
      var thunk = thunks()
      var called = 0
      var lazy = thunk(function (callback) {
        called += 1
        callback()
      })

      should(called).be.equal(0)
      lazy()
      should(called).be.equal(1)
      done()
    })
  })

  tman.suite('thunk.all()', function () {
    tman.it('thunk.all(array)', function (done) {
      var thunk = thunks()
      thunk.all([])(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([])
        return thunk.all([1, 2, 3, 4, 5])
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([1, 2, 3, 4, 5])
        return thunk.all([
          0,
          thunk(1),
          thunk(thunk(2)),
          thunk(function (callback) {
            setImmediate(function () {
              callback(null, 3)
            })
          }),
          thunk(thunk(function (callback) {
            setImmediate(function () {
              callback(null, 4)
            })
          })), [5]
        ])
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([0, 1, 2, 3, 4, [5]])
        return thunk.all([
          0,
          thunk(1),
          thunk(thunk(2)),
          thunk(function (callback) {
            setImmediate(function () {
              callback(null, 3)
            })
          }),
          thunk(function (callback) {
            noneFn()
          }), [5]
        ])(function (error, value) {
          should(error).be.instanceOf(Error)
          should(value).be.equal(undefined)
          return thunk.all(1)
        })(function (error, value) {
          should(error).be.instanceOf(Error)
          should(value).be.equal(undefined)
          return thunk(x)
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql(x)
      })(done)
    })

    tman.it('thunk.all(object)', function (done) {
      var thunk = thunks()
      thunk.all({})(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql({})
        return thunk.all({
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: [5]
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql({
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: [5]
        })
        return thunk.all({
          a: 1,
          b: thunk(2),
          c: typeof Promise === 'function' ? Promise.resolve(3) : 3,
          d: thunk(function (callback) {
            setImmediate(function () {
              callback(null, 4)
            })
          }),
          e: [5]
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql({
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: [5]
        })
        return thunk.all({
          a: 1,
          b: thunk(2),
          c: thunk(thunk(3)),
          d: thunk(function (callback) {
            noneFn()
          }),
          e: [5]
        })
      })(function (error, value) {
        should(error).be.instanceOf(Error)
        should(value).be.equal(undefined)
      })(done)
    })

    tman.it('thunk.all(arg1, arg2, ...)', function (done) {
      var thunk = thunks()
      thunk.all(1, 2, 3, 4, 5)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([1, 2, 3, 4, 5])
        return thunk.all(thunk(1), 2, {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: [5]
        }, function (callback) {
          callback(null, 6, 7, 8)
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([1, 2, {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: [5]
        }, [6, 7, 8]])
      })(done)
    })

    tman.it('thunk.all.call()', function (done) {
      var thunk = thunks()
      thunk.all.call(x, [1, 2, 3, 4, 5])(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([1, 2, 3, 4, 5])
        should(this).be.equal(x)
        return thunk.all.call(x, {
          a: 1,
          b: 2,
          c: 3,
          d: function (callback) {
            should(this).be.equal(x)
            callback(null, 4)
          },
          e: [
            function (callback) {
              should(this).be.equal(x)
              callback(null, 5)
            }
          ]
        })
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql({
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: [5]
        })
        should(this).be.equal(x)
      })(done)
    })
  })

  tman.suite('thunk.seq()', function () {
    tman.it('thunk.seq()', function (done) {
      var thunk = thunks()
      thunk.seq(1, 2, [3, 4], '5')(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([1, 2, [3, 4], '5'])
        var flag = []
        return thunk.seq([
          function (callback) {
            setTimeout(function () {
              should(flag).be.eql([])
              flag[0] = true
              callback(null, 'a', 'b')
            }, 100)
          },
          thunk(function (callback) {
            should(flag).be.eql([true])
            flag[1] = true
            callback(null, 'c')
          }), [thunk('d'), thunk('e')],
          function (callback) {
            should(flag).be.eql([true, true])
            flag[2] = true
            callback(null, 'f')
          }
        ])
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([
          ['a', 'b'], 'c', ['d', 'e'], 'f'
        ])
        return thunk.seq(
          0,
          thunk(1),
          thunk(thunk(2)),
          thunk(function (callback) {
            should('It will be run!').be.equal('It will be run!')
            setImmediate(function () {
              callback(null, 3)
            })
          }),
          thunk(function (callback) {
            noneFn()
          }),
          thunk(function (callback) {
            should('It will not run!').be.equal('')
          })
        )(function (error, value) {
          should(error).be.instanceOf(Error)
          should(value).be.equal(undefined)
          return thunk.seq(1)
        })(function (error, value) {
          should(error).be.equal(null)
          should(value).be.eql([1])
          return thunk.seq()
        })(function (error, value) {
          should(error).be.equal(null)
          should(value).be.eql([])
        })
      })(done)
    })

    tman.it('thunk.seq.call()', function (done) {
      var thunk = thunks()
      thunk.seq.call(x, 1, 2, 3, 4, function (callback) {
        should(this).be.equal(x)
        callback(null, 5)
      }, [
        function (callback) {
          should(this).be.equal(x)
          callback(null, 6)
        }
      ])(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([1, 2, 3, 4, 5, [6]])
        should(this).be.equal(x)
      })(done)
    })
  })

  tman.suite('thunk.race()', function () {
    tman.it('thunk.race()', function (done) {
      var thunk = thunks()
      var finish = 0
      thunk.race(1, 2, 3, 4, 5)(function (error, value) {
        should(finish).be.equal(0)
        should(error).be.equal(null)
        should(value).be.equal(1)
        finish = 1
        return thunk.race([
          function (callback) {
            setTimeout(function () {
              callback(null, 'a')
            }, 20)
          },
          function (callback) {
            setTimeout(function () {
              callback(null, 'b')
            }, 10)
          },
          thunk.delay(50)(function () {
            return 'c'
          })
        ])
      })(function (error, value) {
        should(finish).be.equal(1)
        should(error).be.equal(null)
        should(value).be.equal('b')
        finish = 2
        return thunk.race(
          thunk.delay(10)(function () {
            return 1
          }),
          thunk.delay(20)(function () {
            return 2
          }),
          thunk.delay(30)(function () {
            return 3
          }),
          thunk.delay()(function () {
            return 4
          })
        )(function (error, value) {
          should(finish).be.equal(2)
          should(error).be.equal(null)
          should(value).be.equal(4)
          finish = 3
        })
      })(done)
    })

    tman.it('thunk.race.call()', function (done) {
      var thunk = thunks()
      thunk.race.call(x, 1, 2, 3, 4)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(1)
        should(this).be.equal(x)
        return thunk.race.call(this, [
          function (callback) {
            should(this).be.equal(x)
            setTimeout(function () {
              callback(null, 'a')
            }, 20)
          },
          function (callback) {
            setTimeout(function () {
              callback(null, 'b')
            }, 10)
          }
        ])
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal('b')
      })(done)
    })
  })

  tman.suite('thunk.digest()', function () {
    tman.it('thunk.digest()', function (done) {
      var thunk = thunks()
      thunk.digest(1, 2)(function (error, value) {
        should(error).be.equal(1)
        should(value).be.equal(undefined)
        return thunk(x)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        return thunk.digest(error, 1, 2, x)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value[0]).be.equal(1)
        should(value[1]).be.equal(2)
        should(value[2]).be.equal(x)
        should(arguments.length).be.equal(2)
      })(done)
    })

    tman.it('thunk.digest.call()', function (done) {
      var thunk = thunks()
      thunk.digest.call(x, 1, 2)(function (error, value) {
        should(error).be.equal(1)
        should(value).be.equal(undefined)
        should(this).be.equal(x)
        return thunk.digest.call(null, null, x)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        should(this).be.equal(x)
      })(done)
    })
  })

  tman.suite('thunk.thunkify()', function () {
    function test (a, b, c, callback) {
      callback(a, b, c, this)
    }

    tman.it('thunk.thunkify()', function (done) {
      var thunk = thunks()
      var thunkTest = thunk.thunkify(test)
      thunkTest(1, 2, 3)(function (error, value) {
        should(error).be.equal(1)
        should(value).be.equal(undefined)
        return thunkTest(null, 2, x)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value[0]).be.equal(2)
        should(value[1]).be.equal(x)
        should(value[2]).be.equal(this)
        should(arguments.length).be.equal(2)
      })(done)
    })

    tman.it('thunk.thunkify.call()', function (done) {
      var thunk = thunks()
      var thunkTest = thunk.thunkify.call(x, test)
      thunkTest(1, 2, 3)(function (error, value) {
        should(error).be.equal(1)
        should(value).be.equal(undefined)
        should(this).be.equal(x)
        return thunkTest(null, 2, x)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value[0]).be.equal(2)
        should(value[1]).be.equal(x)
        should(value[2]).be.equal(x)
        should(this).be.equal(x)
        should(arguments.length).be.equal(2)
      })(done)
    })
  })

  tman.suite('thunk.lift()', function () {
    function test (a, b) {
      return a === b
    }

    tman.it('thunk.lift()', function (done) {
      var thunk = thunks()
      var testT = thunk.lift(test)

      testT(1, thunk(1))(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(true)
        return testT(x, thunk(function (callback) {
          setTimeout(function () {
            callback(null, x)
          })
        }))
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(true)
        return testT(1, thunk(2))
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(false)
        return thunk.lift(function (a, b, c, d) {
          should(a).be.equal(1)
          should(b).be.equal('a')
          should(c).be.equal(x)
          should(d).be.eql([1, 2, 3])
          return 'OK'
        })(thunk(1), thunk('a'), thunk(x), thunk([1, 2, 3]))
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal('OK')
      })(done)
    })

    tman.it('thunk.lift.call()', function (done) {
      var thunk = thunks()
      var obj = {
        x: x,
        test: function (arg) {
          return arg === this.x
        }
      }
      var testT = thunk.lift.call(obj, obj.test)
      testT(x)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(true)
        should(this.x).be.equal(x)
      })(done)
    })

    tman.it('thunk.lift() with error', function (done) {
      var thunk = thunks()
      var testT = thunk.lift(test)
      testT(thunk(1), function (callback) { throw new Error('some error') })(function (error, value) {
        should(error).be.instanceOf(Error)
        should(error.message).be.equal('some error')
        should(value).be.equal(undefined)
      })(done)
    })
  })

  tman.suite('thunk.persist()', function () {
    tman.it('thunk.persist()', function (done) {
      var thunk = thunks()
      var test = thunk.persist(thunk(x))
      thunk.all(
        test(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(x)
          return x
        }),
        test(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(x)
          return test
        }),
        test(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(x)
          return thunk(x)
        }),
        test(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(x)
        })(function () {
          return x
        }),
        test,
        thunk(test),
        thunk.persist(x)
      )(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([x, x, x, x, x, x, x])
        var test2 = thunk.persist(thunk.delay(100)(function () {
          return x
        }))
        return thunk.all(test2, test2, test2)
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.eql([x, x, x])
      })(done)
    })

    tman.it('thunk.persist.call()', function (done) {
      var thunk = thunks()
      var obj = {x: x}
      var test = thunk.persist.call(obj, thunk(x))
      test(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        should(this.x).be.equal(x)
        return test
      })(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(x)
        should(this.x).be.equal(x)
      })(done)
    })

    tman.it('thunk.persist() with error', function (done) {
      var thunk = thunks()
      var test = thunk.persist(thunk(function () { noneFn() }))
      test(function (error, value) {
        should(error).be.instanceOf(Error)
        should(value).be.equal(undefined)
        return test(function (error2) {
          should(error2).be.equal(error)
        })
      })(function () {
        return thunk.persist(1)(function (error, value) {
          should(error).be.equal(null)
          should(value).be.equal(1)
          throw new Error('some error')
        })
      })(function (error, value) {
        should(error).be.instanceOf(Error)
        should(error.message).be.equal('some error')
      })(done)
    })
  })

  tman.suite('thunk.delay()', function () {
    tman.it('thunk.delay()', function (done) {
      var thunk = thunks()
      var time = Date.now()
      thunk.delay(100)(function (error, value) {
        should(error).be.equal(null)
        should(Date.now() - time >= 99).be.equal(true)
        return thunk.delay(100)
      })(function (error, value) {
        should(error).be.equal(null)
        should(Date.now() - time >= 199).be.equal(true)
      })(done)
    })

    tman.it('thunk.delay.call()', function (done) {
      var thunk = thunks()
      var time = Date.now()
      thunk.delay.call(x, 100)(function (error, value) {
        should(error).be.equal(null)
        should(Date.now() - time >= 99).be.equal(true)
        should(this).be.equal(x)
      })(done)
    })
  })

  tman.suite('thunk.stop()', function () {
    tman.it('thunk.stop()', function (done) {
      var thunk = thunks()
      thunk(1)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(1)
        thunk.stop()
        should('It will not run!').be.equal('')
      })(function () {
        should('It will not run!').be.equal('')
      })
      done()
    })

    tman.it('thunk.stop("stop message")', function (done) {
      var thunk = thunks({
        onstop: function (res) {
          if (res && res.status === 19) {
            should(res.message).be.equal('stop message')
            done()
          }
        }
      })
      thunk(1)(function (error, value) {
        should(error).be.equal(null)
        should(value).be.equal(1)
        thunk.stop('stop message')
        should('It will not run!').be.equal('')
      })(function () {
        should('It will not run!').be.equal('')
      })
    })
  })

  tman.suite('extremely control flow (100000)', function () {
    var extreme = 100000
    this.timeout(10000)

    tman.it('extremely sync chain', function (done) {
      var thunk = thunks()
      var i = extreme
      var thunkFn = thunk(0)
      while (i--) {
        thunkFn = thunkFn(function (err, res) {
          if (err != null) throw err
          return thunk(++res)
        })
      }
      thunkFn(function (err, res) {
        should(err).be.equal(null)
        should(res).be.equal(extreme)
      })(done)
    })

    tman.it('extremely async chain', function (done) {
      var thunk = thunks()
      var i = extreme
      var thunkFn = thunk(0)
      while (i--) {
        thunkFn = thunkFn(function (err, res) {
          if (err != null) throw err
          return function (callback) {
            setImmediate(function () {
              callback(null, ++res)
            })
          }
        })
      }
      thunkFn(function (err, res) {
        should(err).be.equal(null)
        should(res).be.equal(extreme)
      })(done)
    })

    tman.it('extremely sequence', function (done) {
      var thunk = thunks()
      var i = extreme
      var list = []
      while (i--) list.push(thunk(list.length))
      thunk.seq(list)(function (err, res) {
        should(err).be.equal(null)
        should(res.length).be.equal(extreme)
        should(res[extreme - 1]).be.equal(extreme - 1)
      })(done)
    })

    tman.it('extremely parallel', function (done) {
      var thunk = thunks()
      var i = extreme
      var list = []
      while (i--) list.push(thunk(list.length))
      thunk.all(list)(function (err, res) {
        should(err).be.equal(null)
        should(res.length).be.equal(extreme)
        should(res[extreme - 1]).be.equal(extreme - 1)
      })(done)
    })
  })

  try { // 检测是否支持 generator，是则加载 generator 测试
    var check = new Function('return function*(){}') // eslint-disable-line
    require('./generator.js')
  } catch (e) {
    console.log('Not support generator!')
  }
})
