'use strict'
/* global */

var thunks = require('..')
require('./thunk.js')(thunks)

var supportGeneratorFn = false
var supportAsyncFn = false

try {
  supportGeneratorFn = new Function('return function * () {}') // eslint-disable-line
} catch (e) {}

try {
  supportAsyncFn = new Function('return async function () {}') // eslint-disable-line
} catch (e) {}

if (supportGeneratorFn) {
  require('./generator.js')(thunks)
} else {
  var fileName = './test/generator.js'
  var fs = require('fs')
  var regenerator = require('regenerator')

  var content = fs.readFileSync(fileName, 'utf8')
  content = regenerator.compile(content, { includeRuntime: true }).code
  var m = module._compile(content, fileName)
  m(thunks)
}

if (supportAsyncFn) {
  require('./async.js')(thunks)
}
