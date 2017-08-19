'use strict'
/* global */

var thunks = require('..')

require('@std/esm')
var thunksM = require('../index.mjs').default

require('./thunk.js')(thunks)
require('./thunk.js')(thunksM)

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
  require('./generator.js')(thunksM)
} else {
  var fileName = './test/generator.js'
  var fs = require('fs')
  var regenerator = require('regenerator')

  var content = fs.readFileSync(fileName, 'utf8')
  content = regenerator.compile(content, {includeRuntime: true}).code
  var m = module._compile(content, fileName)
  m(thunks)
  m(thunksM)
}

if (supportAsyncFn) {
  require('./async.js')(thunks)
  require('./async.js')(thunksM)
}
