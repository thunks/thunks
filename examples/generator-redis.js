'use strict'
/*global module, process*/

var redis = require('thunk-redis')
var db = redis.createClient()

db.select(1)(function *(error, res) {
  console.log(error, res)
  yield this.set('foo', 'bar')
  yield this.set('bar', 'baz')

  console.log('foo -> %s', yield this.get('foo'))
  console.log('bar -> %s', yield this.get('bar'))
  return this.quit()
})(function (error, res) {
  console.log(error, res)
})
