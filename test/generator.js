'use strict';
/*global describe, it, before, after, beforeEach, afterEach, Promise, noneFn*/

/*jshint -W124*/

var should = require('should'),
  thunks = require('../thunks.js');

module.exports = function(done) {
  var thunk = thunks();
  var x = {};

  thunk(function*() {
    should(yield 1).be.equal(1);
    should(yield null).be.equal(null);
    should(yield thunk(1)).be.equal(1);
    should(yield Promise.resolve(1)).be.equal(1);
    should(yield [1, 2, 3]).be.eql([1, 2, 3]);
    should(yield [1, 2, thunk(3)]).be.eql([1, 2, 3]);
    should(yield {}).be.eql({});
    should(yield {
      name: 'thunks',
      version: thunk('v2')
    }).be.eql({
      name: 'thunks',
      version: 'v2'
    });
    should(yield [{},
      [],
      [{}]
    ]).be.eql([{},
      [],
      [{}]
    ]);
    return yield [
      1,
      function(cb) {
        setTimeout(function() {
          cb(null, 2);
        });
      },
      thunk(3),
      Promise.resolve(4),
      thunk(function*() {
        return yield 5;
      })
    ];
  })(function*(error, res) {
    should(error).be.equal(null);
    should(res).be.eql([1, 2, 3, 4, 5]);
    return yield [1, Promise.reject(new Error('some error')), 3];
  })(function*(error, res) {
    should(error).be.instanceOf(Error);
    should(error.message).be.equal('some error');
    should(res).be.equal(undefined);
    should(
      yield res).be.equal(undefined);
    return thunk.call(x, function*() {
      should(this).be.equal(x);
      return yield [function(callback) {
          should(this).be.equal(x);
          callback(null, 1);
        },
        [function(callback) {
          should(this).be.equal(x);
          callback(null, 1);
        }]
      ];
    });
  })(function*(error, res) {
    should(error).be.equal(null);
    should(res).be.eql([1, [1]]);
    should(yield function*() {
      return yield 1;
    }).be.equal(1);

    return function*() {
      return yield [1, 2, 3, 4, 5];
    };
  })(function*(error, res) {
    should(error).be.equal(null);
    should(res).be.eql([1, 2, 3, 4, 5]);
    should(yield res).be.eql([1, 2, 3, 4, 5]);

    return (function*() {
      return yield [1, 2, 3, 4, 5];
    })();
  })(function*(error, res) {
    should(error).be.equal(null);
    should(res).be.eql([1, 2, 3, 4, 5]);
    try {
      yield function() {
        noneFn();
      };
    } catch (err) {
      error = err;
    }
    should(error).be.instanceOf(Error);

    yield function*() {
      noneFn();
    };

  })(function*(error, res) {
    should(error).be.instanceOf(Error);
    should(res).be.equal(undefined);
    return yield [thunk.all([
      function*() {
        return yield 1;
      }, (function*() {
        return yield 2;
      }())
    ]), thunk.seq([
      function*() {
        return yield 3;
      }, (function*() {
        return yield 4;
      }())
    ])];
  })(function(error, res) {
    should(error).be.equal(null);
    should(res).be.eql([
      [1, 2],
      [3, 4]
    ]);
  })(function() {
    thunk(function* () {
      try {
        yield function*(error, value) {
          thunk.stop();
          should('It will not be run!').be.equal(true);
        };
      } catch (e) {
        should('It will not be run!').be.equal(true);
      }
    })(function(error, value) {
      should('It will not be run!').be.equal(true);
    });
  })(done);
};
