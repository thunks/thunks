'use strict'
/* global */

var thunks = require('..')
require('./thunk.js')(thunks)

var thunksM
// @std/esm can't support v4
if (!process.version.startsWith('v4.')) {
  thunksM = require('@std/esm')(module)('../index.mjs').default
  require('./thunk.js')(thunksM)
}

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
  if (thunksM) require('./generator.js')(thunksM)
} else {
  var fileName = './test/generator.js'
  var fs = require('fs')
  var regenerator = require('regenerator')

  var content = fs.readFileSync(fileName, 'utf8')
  content = regenerator.compile(content, {includeRuntime: true}).code
  var m = module._compile(content, fileName)
  m(thunks)
  if (thunksM) m(thunksM)
}

if (supportAsyncFn) {
  require('./async.js')(thunks)
  if (thunksM) require('./async.js')(thunksM)
}
