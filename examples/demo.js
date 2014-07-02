'use strict';
/*global module, process*/

var thunks = require('../thunks.js');

// 生成 带有onerror 监听的 thunk 主函数。
var Thunk = thunks(function (error) {
  console.log('Thunk Error:', error);
});

Thunk(function (callback) {

  callback(null, 1, 2, 3);

})(function (error, value1, value2, value3) {

  console.log(error, value1, value2, value3); // null, 1, 2, 3
  return Thunk(function (callback) {
    setImmediate(function () {callback(null, 4, 5, 6);});
  });

})(function (error, value1, value2, value3) {

  console.log(error, value1, value2, value3); // null, 4, 5, 6
  return [7, 8, 9];

})(function (error, value) {

  console.log(error, value); // null, [7, 8, 9]

  var thunk1 = Thunk(1);

  var thunk2 = thunk1(function (error, value) {
    console.log(error, value); // null, 1
    return 2;
  });

  var thunk3 = thunk2(function (error, value) {
    return Thunk(function (callback) {
      setImmediate(function () {callback(null, 2);});
    });
  });

  thunk3(function (error, value) {
    console.log(error, value); // null, 2
    Thunk(Thunk(Thunk(999)))(function (error, value) {
      console.log(error, value); // null, 999
    });
  })(function () {
    var a = {x: 1};
    return Thunk.digest.call(a, null, 1, 2)(function (error, value, value2) {
      console.log(this, error, value, value2); // { x: 1 } null 1 2

      throw new Error('some error!!!!');
    });
  });
});

