'use strict';
/*global describe, it, before, after, beforeEach, afterEach, Promise, noneFn*/

var should = require('should'),
  thunks = require('../thunks.js'),
  thenjs = require('thenjs'),
  x = {};

describe('thunks', function(){

  describe('thunks()', function(){

    it('thunks(onerror)', function (done) {
      var Thunk = thunks(function (error) {
        should(error).be.instanceOf(Error);
        should(error.message).be.equal('some error!');
        done();
      });

      Thunk()(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(undefined);
        throw new Error('some error!');
      })(function () {
        should('this function will not run').be.equal('');
      });
    });

    it('thunks(onerror) [return true]', function (done) {
      var Thunk = thunks({
        onerror: function (error) {
          should(error).be.instanceOf(Error);
          should(error.message).be.equal('some error and continue!');
          return true;
        }
      });

      Thunk()(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(undefined);
        throw new Error('some error and continue!');
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(undefined);
        done();
      });
    });

    it('thunks({onerror: onerror})', function (done) {
      var Thunk = thunks({
        onerror: function (error) {
          should(error).be.instanceOf(Error);
          should(error.message).be.equal('some error!');
          done();
        }
      });
      Thunk(x)(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
        throw new Error('some error!');
      })(function () {
        throw new Error('this function will not run');
      });
    });

    it('thunks({debug: debug})', function (done) {
      var _debug = null;
      var Thunk = thunks({
        debug: function () { _debug = arguments; }
      });
      Thunk(x)(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
        should(_debug[0]).be.equal(null);
        should(_debug[1]).be.equal(x);
        throw new Error('some error!');
      })(function (error, value) {
        should(error).be.instanceOf(Error);
        should(error.message).be.equal('some error!');
        should(value).be.equal(undefined);
        should(_debug[0]).be.equal(error);
        should(_debug.length).be.equal(1);
      })(done);
    });
  });

  describe('Thunk()', function(){

    it('Thunk(value)', function (done) {
      var Thunk = thunks();
      Thunk(1)(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(1);
        return 2;
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(2);
        return Thunk(x);
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
      })(done);
    });

    it('Thunk(thunk)', function (done) {
      var Thunk = thunks();
      Thunk(Thunk(x))(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
        return Thunk(Thunk(Thunk(function (callback) {
          callback(null, 1, x);
        })));
      })(function (error, value1, value2, value3) {
        should(error).be.equal(null);
        should(value1).be.equal(1);
        should(value2).be.equal(x);
        should(value3).be.equal(undefined);
      })(done);
    });

    it('Thunk(function)', function (done) {
      var Thunk = thunks();
      var thunk1 = Thunk(function (callback) {
        callback(null, 1);
      });
      var thunk2 = thunk1(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(1);
        return 2;
      });
      var thunk3 = thunk2(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(2);
        return Thunk(function (callback) {
          setImmediate(function () {
            callback(null, x);
          });
        });
      });
      thunk3(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
        return Thunk(function (callback) {
          setImmediate(function () {
            callback(false, true);
          });
        });
      })(function (error, value) {
        should(error).be.equal(false);
        should(value).be.equal(undefined);
        return Thunk(function (callback) {
          callback(null, 1, 2, 3, x);
        });
      })(function (error, value1, value2, value3, value4) {
        should(error).be.equal(null);
        should(value1).be.equal(1);
        should(value2).be.equal(2);
        should(value3).be.equal(3);
        should(value4).be.equal(x);
        return Thunk(function (callback) {
          setImmediate(function () {callback(null, 1);});
        })(function (error, value) {
          should(error).be.equal(null);
          should(value).be.equal(1);
          return value * 2;
        })(function (error, value) {
          should(error).be.equal(null);
          should(value).be.equal(2);
          return Thunk(function (callback) {
            setImmediate(function () {callback(null, value * 2);});
          });
        })(function (error, value) {
          should(error).be.equal(null);
          should(value).be.equal(4);
          return value * 2;
        });
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(8);
        return Thunk(Thunk(value * 2));
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(16);
        return Thunk(function (callback) {
          callback(null, 1);
          callback(null, 2);
        })(function (error, value) {
          should(value).be.equal(1);
        });
      })(done);
    });

    it('Thunk(promise)', function (done) {
      var Thunk = thunks();
      if (typeof Promise === 'function') {
        Thunk(Promise.resolve(x))(function (error, value) {
          should(error).be.equal(null);
          should(value).be.equal(x);
          return Thunk(Promise.reject(new Error('some error!')));
        })(function (error, value) {
          should(error).be.instanceOf(Error);
          should(error.message).be.equal('some error!');
          should(value).be.equal(undefined);
          return new Promise(function (resolve, rejecct) {
            setImmediate(function () { resolve(x); });
          });
        })(function (error, value) {
          should(error).be.equal(null);
          should(value).be.equal(x);
        })(done);
      } else {
        done();
      }
    });

    it('Thunk(toThunk)', function (done) {
      var Thunk = thunks();
      Thunk(thenjs(x))(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
        return Thunk(thenjs(function (cont) {
          throw new Error('some error!');
        }));
      })(function (error, value) {
        should(error).be.instanceOf(Error);
        should(error.message).be.equal('some error!');
        should(value).be.equal(undefined);
        return thenjs(function (cont) {
          setImmediate(function () { cont(null, x); });
        });
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
      })(done);
    });

    it('Thunk.call()', function (done) {
      var Thunk = thunks();
      Thunk.call(x, 1)(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(1);
        should(this).be.equal(x);
        return value * 2;
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(2);
        should(this).be.equal(x);
        return Thunk.call(null, 10);
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(10);
        should(this).be.equal(x);
      })(done);
    });
  });

  describe('Thunk.all()', function(){

    it('Thunk.all(array)', function (done) {
      var Thunk = thunks();
      Thunk.all([])(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql([]);
        return Thunk.all([1, 2, 3, 4, 5]);
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql([1, 2, 3, 4, 5]);
        return Thunk.all([
          0,
          Thunk(1),
          Thunk(Thunk(2)),
          Thunk(function (callback) {
            setImmediate(function () { callback(null, 3); });
          }),
          Thunk(Thunk(function (callback) {
            setImmediate(function () { callback(null, 4); });
          })),
          [5]
        ]);
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql([0, 1, 2, 3, 4, [5]]);
        return Thunk.all([
          0,
          Thunk(1),
          Thunk(Thunk(2)),
          Thunk(function (callback) {
            setImmediate(function () { callback(null, 3); });
          }),
          Thunk(function (callback) {
            noneFn();
          }),
          [5]
        ])(function (error, value) {
          should(error).be.instanceOf(Error);
          should(value).be.equal(undefined);
          return Thunk.all(1);
        })(function (error, value) {
          should(error).be.instanceOf(Error);
          should(value).be.equal(undefined);
          return Thunk(x);
        });
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql(x);
      })(done);
    });

    it('Thunk.all(object)', function (done) {
      var Thunk = thunks();
      Thunk.all({})(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql({});
        return Thunk.all({a: 1, b: 2, c: 3, d: 4, e: [5]});
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql({a: 1, b: 2, c: 3, d: 4, e: [5]});
        return Thunk.all({
          a: 1,
          b: Thunk(2),
          c:  typeof Promise === 'function'? Promise.resolve(3) : 3,
          d: Thunk(function (callback) {
            setImmediate(function () { callback(null, 4); });
          }),
          e: [5]
        });
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql({a: 1, b: 2, c: 3, d: 4, e: [5]});
        return Thunk.all({
          a: 1,
          b: Thunk(2),
          c: Thunk(Thunk(3)),
          d: Thunk(function (callback) {
            noneFn();
          }),
          e: [5]
        });
      })(function (error, value) {
        should(error).be.instanceOf(Error);
        should(value).be.equal(undefined);
      })(done);
    });

    it('Thunk.all.call()', function (done) {
      var Thunk = thunks();
      Thunk.all.call(x, [1, 2, 3, 4, 5])(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql([1, 2, 3, 4, 5]);
        should(this).be.equal(x);
        return Thunk.all.call(null, {a: 1, b: 2, c: 3, d: 4, e: [5]});
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql({a: 1, b: 2, c: 3, d: 4, e: [5]});
        should(this).be.equal(x);
      })(done);
    });
  });

  describe('Thunk.seq()', function(){

    it('Thunk.seq()', function (done) {
      var Thunk = thunks();
      Thunk.seq(1, 2, [3, 4], '5')(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql([1, 2, [3, 4], '5']);
        var flag = [];
        return Thunk.seq([
          function (callback) {
            setTimeout(function () {
              should(flag).be.eql([]);
              flag[0] = true;
              callback(null, 'a', 'b');
            }, 100);
          },
          Thunk(function (callback) {
            should(flag).be.eql([true]);
            flag[1] = true;
            callback(null, 'c');
          }),
          [Thunk('d'), Thunk('e')],
          function (callback) {
            should(flag).be.eql([true, true]);
            flag[2] = true;
            callback(null, 'f');
          }
        ]);
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql([['a', 'b'], 'c', ['d', 'e'], 'f']);
        return Thunk.seq(
          0,
          Thunk(1),
          Thunk(Thunk(2)),
          Thunk(function (callback) {
            should('It will be run!').be.equal('It will be run!');
            setImmediate(function () { callback(null, 3); });
          }),
          Thunk(function (callback) {
            noneFn();
          }),
          Thunk(function (callback) {
            should('It will not be run!').be.equal('');
          })
        )(function (error, value) {
          should(error).be.instanceOf(Error);
          should(value).be.equal(undefined);
          return Thunk.seq(1);
        })(function (error, value) {
          should(error).be.equal(null);
          should(value).be.eql([1]);
          return Thunk(x);
        });
      })(done);
    });

    it('Thunk.seq.call()', function (done) {
      var Thunk = thunks();
      Thunk.seq.call(x, 1, 2, 3, 4, 5)(function (error, value) {
        should(error).be.equal(null);
        should(value).be.eql([1, 2, 3, 4, 5]);
        should(this).be.equal(x);
      })(done);
    });

  });

  describe('Thunk.digest()', function(){

    it('Thunk.digest()', function (done) {
      var Thunk = thunks();
      Thunk.digest(1, 2)(function (error, value) {
        should(error).be.equal(1);
        should(value).be.equal(undefined);
        return Thunk(x);
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
        return Thunk.digest(error, 1, 2, x);
      })(function (error, value1, value2, value3) {
        should(error).be.equal(null);
        should(value1).be.equal(1);
        should(value2).be.equal(2);
        should(value3).be.equal(x);
      })(done);

    });

    it('Thunk.digest.call()', function (done) {
      var Thunk = thunks();
      Thunk.digest.call(x, 1, 2)(function (error, value) {
        should(error).be.equal(1);
        should(value).be.equal(undefined);
        should(this).be.equal(x);
        return Thunk.digest.call(null, null, x);
      })(function (error, value) {
        should(error).be.equal(null);
        should(value).be.equal(x);
        should(this).be.equal(x);
      })(done);

    });
  });

  describe('Thunk.thunkify()', function(){
    function test(a, b, c, callback) {
      callback(a, b, c, this);
    }

    it('Thunk.thunkify()', function (done) {
      var Thunk = thunks();
      var thunkTest = Thunk.thunkify(test);
      thunkTest(1, 2, 3)(function (error, value) {
        should(error).be.equal(1);
        should(value).be.equal(undefined);
        return thunkTest(null, 2, x);
      })(function (error, value1, value2, value3) {
        should(error).be.equal(null);
        should(value1).be.equal(2);
        should(value2).be.equal(x);
        should(value3).be.equal(this);
      })(done);
    });

    it('Thunk.thunkify.call()', function (done) {
      var Thunk = thunks();
      var thunkTest = Thunk.thunkify.call(x, test);
      thunkTest(1, 2, 3)(function (error, value) {
        should(error).be.equal(1);
        should(value).be.equal(undefined);
        should(this).be.equal(x);
        return thunkTest(null, 2, x);
      })(function (error, value1, value2, value3) {
        should(error).be.equal(null);
        should(value1).be.equal(2);
        should(value2).be.equal(x);
        should(value3).be.equal(x);
        should(this).be.equal(x);
      })(done);
    });
  });

  describe('Thunk.delay()', function(){

    it('Thunk.delay()', function (done) {
      var Thunk = thunks();
      var time = Date.now();
      Thunk.delay(100)(function (error, value) {
        should(error).be.equal(null);
        should(Date.now() - time >= 99).be.equal(true);
        return Thunk.delay(1000);
      })(function (error, value) {
        should(error).be.equal(null);
        should(Date.now() - time >= 1099).be.equal(true);
      })(done);
    });

    it('Thunk.digest.call()', function (done) {
      var Thunk = thunks();
      var time = Date.now();
      Thunk.delay.call(x, 1010)(function (error, value) {
        should(error).be.equal(null);
        should(Date.now() - time >= 1009).be.equal(true);
        should(this).be.equal(x);
      })(done);

    });
  });
});
