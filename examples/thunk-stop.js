'use strict';
/*global console, noneFn*/

var Thunk = require('../thunks.js')({
  debug: function(res) {
    if (res) console.log(res); // { [Error: Stop now!] code: {}, status: 19 }
  }
});

Thunk(function(callback) {
  Thunk.stop('Stop now!');
  console.log('It will not be run!');
})(function(error, value) {
  console.log('It will not be run!');
});

Thunk.delay(100)(function() {
  console.log('Hello');
  return Thunk.delay(100)(function() {
    Thunk.stop('Stop now!');
    console.log('It will not be run!');
  });
})(function(error, value) {
  console.log('It will not be run!');
});
