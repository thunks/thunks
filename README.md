thunks v1.5.3 [![Build Status](https://travis-ci.org/thunks/thunks.svg)](https://travis-ci.org/thunks/thunks)
====
A basic asynchronous utilily module beyond Promise magically.

[中文说明](https://github.com/thunks/thunks/blob/master/README_zh.md)

Thinking and programming in thunks is similar to that in native Promise. But there are some different points:

1. Native Promise is a new feature in ES6, thunks is not using JavaScript special features to run flawlessly under ES3.

2. After wrapped by Promise we get objects with logics in Promise objects,
methods of properties of these Promise objects could be modified(injuected);
While thunks returns thunk functions, with logics inside function scopes,
which means they would never be injected from outside.

3. Promise claims it's functional, while thunks is functional
and it obeys the continuous-passing style.

4. Having the same power as Promise, thunks' API is more consice,
and thunks' implementaton is simpler.

5. thunks brings a perfect `debug` mode, which seems not appear in Promise?

6. thunks is **5 times** faster as native Promise.

Read in `exmples/` diretory for more demos on thunks.
Build asynchronous program in an extraordinary simple way.

**You don't have to wait till all bowsers have implemented Promise natively, but by just these **200sloc** you will get more powerful tools for handling aynchronous code.**

## What is a thunk?

1. **`thunk`** is a function that encapsulates synchronous or asynchronous code inside.

2. **`thunk`** accepts only one `callback` function as an arguments, which is a CPS function;

3. **`thunk`** returns another **`thunk`** function after being called, for chaining operations;

4. **`thunk`** would passing the results into a `callback` function after excuted.

5. If `callback` returns a new **`thunk`** function, then it would be send to another **`thunk`** to excute,
or it would be send to another new **`thunk`** function as the value of the computation.

## Benchmark

By running `node benchmark/index.js` in a CentOS virtual machine:

```bash
[root@centos thunk]# node benchmark/index
Sync Benchmark...

JSBench Start (100 cycles, async mode):
Test Promise...
Test thunk...

JSBench Results:
Promise: 1000 cycles, 13.238 ms/cycle, 75.540 ops/sec
thunk: 1000 cycles, 2.463 ms/cycle, 406.009 ops/sec

Promise: 100%; thunk: 537.47%;

JSBench Completed!
```

**By testing with the same operations, Thunk performs 4 times faster comparing to native Promise.**

## Demo

```js
var thunks = require('../thunks.js');
var fs = require('fs');
var Thunk = thunks(function (error) { console.error('Thunk error:', error); });

Thunk.
  all(['examples/demo.js', 'thunks.js', '.gitignore'].map(function (path) {
    return Thunk(function (callback) { fs.stat(path, callback); });
  }))(function (error, result) {
    console.log('Success: ', result);
    return Thunk(function (callback) { fs.stat('none.js', callback); });
  })(function (error, result) {
    console.error('This should not run!', error);
  });
```

No `Maximum call stack size exceeded` error in 1000000 sync series

```js
var Thunk = require('../thunks.js')();
var thunk = Thunk(0);

function callback(error, value) {
  return ++value;
}

console.time('Thunk_series');
for (var i = 0; i < 1000000; i++) {
  thunk = thunk(callback);
}

thunk(function (error, value) {
  console.log(error, value); // null 1000000
  console.timeEnd('Thunk_series'); // ~827ms
});
```

## Installation

**Node.js:**

    npm install thunks

**Bower:**

    bower install thunks

**browser:**

```html
<script src="/pathTo/thunks.js"></script>
```

## API

```js
var thunks = require('thunks');
```

### thunks([options])

Generator of `thunks`, it generates the main function of `Thunk` with its scope.
"scope" refers to the running evironments `Thunk` generated(directly or indirectly) for all `thunk` functions.

1. Here's how you create a basic `Thunk`, any exceptions would be passed the next `thunk` function:

    ```js
    var Thunk = thunks();
    ```

2. Here's the way to create a `Thunk` listening to all exceptions in current scope with `onerror`,
and it will make sure the exeptions not being passed to the followed `thunk` function, unless `onerror` function return `true`.

    ```js
    var Thunk = thunks(function (error) { console.error(error); });
    ```

3. Create a `Thunk` with `onerror` and `debug` listeners.
Results of this `Thunk` would be passed to `debug` function first before passing to the followed `thunk` function.

    ```js
    var Thunk = thunks({
      onerror: function (error) { console.error(error); },
      debug: function () { console.log.apply(console, arguments); }
    });
    ```

Even multiple `Thunk` main functions with diferent scope are composed,
each scope would be seperated from each other,
which means, `onerror` and `debug` would not run in other scopes.

### Thunk(start)

This is the main function, to create new `thunk` functions.

The parameter `start` could be:

1. a `thunk` function, by calling this function a new `thunk` function will be returned

    ```js
    var thunk1 = Thunk(1);
    var thunk2 = Thunk(thunk1); // thunk2 equals to thunk1;
    ```

2. `function (callback) {}`, by calling it, results woule be gathered and be passed to the next `thunk` function

    ```js
    Thunk(function (callback) {
      callback(null, 1)
    })(function (error, value) {
      console.log(error, value); // null 1
    });
    ```

3. a Promise object, results of Promise would be passed to a new `thunk` function

    ```js
    var promise = Promise.resolve(1);

    Thunk(promise)(function (error, value) {
      console.log(error, value); // null 1
    });
    ```

4. objects which implements methods of `toThunk`

    ```js
    var then = Thenjs(1); // then.toThunk() return a thunk function

    Thunk(then)(function (error, value) {
      console.log(error, value); // null 1
    });
    ```

5. values in other types would be valid results passing to a new `thunk` function

    ```js
    Thunk(1)(function (error, value) {
      console.log(error, value); // null 1
    });

    Thunk([1, 2, 3])(function (error, value) {
      console.log(error, value); // null [1, 2, 3]
    });
    ```

You can also run with `this`:

    ```js
    Thunk.call({x: 123}, 456)(function (error, value) {
      console.log(error, this.x, value); // null 123 456
      return 'thunk!';
    })(function (error, value) {
      console.log(error, this.x, value); // null 123 'thunk!'
    });
    ```

### Thunk.all(obj)

Returns a `thunk` function.

`obj` can be an array or an object that contains any value. `Thunk.all` will transform value to a `thunk` function and excuted it in parallel. After all of them are finished, an array containing results(in its original order) would be passed to the a new `thunk` function.

```js
Thunk.all([
  Thunk(0),
  Thunk(1),
  2,
  Thunk(function (callback) { callback(null, [3]); })
])(function (error, value) {
  console.log(error, value); // null [0, 1, 2, [3]]
});

Thunk.all({
  a: Thunk(0),
  b: Thunk(1),
  c: 2,
  d: Thunk(function (callback) { callback(null, [3]); })
})(function (error, value) {
  console.log(error, value); // null {a: 0, b: 1, c: 2, d: [3]}
});
```

You may also write code like this:

```js
Thunk.all.call({x: [1, 2, 3]}, [4, 5, 6])(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] [4, 5, 6]
  return 'thunk!';
})(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] 'thunk!'
});
```

### Thunk.seq([thunk1, ..., thunkX])
### Thunk.seq(thunk1, ..., thunkX)

Returns a `thunk` function.

`thunkX` can be any value, `Thunk.seq` will transform value to a `thunk` function and excuted it in order. After all of them are finished, an array containing results(in its original order) would be passed to the a new `thunk` function.

```js
Thunk.seq([
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b');
    }, 100);
  },
  Thunk(function (callback) {
    callback(null, 'c');
  }),
  [Thunk('d'), Thunk('e')], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true]);
    flag[2] = true;
    callback(null, 'f');
  }
])(function (error, value) {
  console.log(error, value); // null [['a', 'b'], 'c', ['d', 'e'], 'f']
});
```
or

```js
Thunk.seq(
  function (callback) {
    setTimeout(function () {
      callback(null, 'a', 'b');
    }, 100);
  },
  Thunk(function (callback) {
    callback(null, 'c');
  }),
  [Thunk('d'), Thunk('e')], // thunk in array will be excuted in parallel
  function (callback) {
    should(flag).be.eql([true, true]);
    flag[2] = true;
    callback(null, 'f');
  }
)(function (error, value) {
  console.log(error, value); // null [['a', 'b'], 'c', ['d', 'e'], 'f']
});
```

You may also write code like this:

```js
Thunk.seq.call({x: [1, 2, 3]}, 4, 5, 6)(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] [4, 5, 6]
  return 'thunk!';
})(function (error, value) {
  console.log(error, this.x, value); // null [1, 2, 3] 'thunk!'
});
```

### Thunk.digest(error, val1, val2, ...)

Returns a `thunk` function.

Transform a Node.js callback function into a `thunk` function.
This `thunk` function retuslts in `(error, val1, val2, ...)`, which is just being passed to a new `thunk` function,
like:

```js
Thunk(function (callback) {
  callback(error, val1, val2, ...);
})
```

One use case:

```js
Thunk(function (callback) {
  //...
  callback(error, result);
})(function (error, value) {
  //...
  return Thunk.digest(error, value);
})(function (error, value) {
  //...
});
```

You may also write code with `this`：

```js
var a = {x: 1};
Thunk.digest.call(a, null, 1, 2)(function (error, value1, value2) {
  console.log(this, error, value1, value2) // { x: 1 } null 1 2
});
```

### Thunk.thunkify(fn)

Returns a new function that would return a `thunk` function

Transform a `fn` function which is in Node.js style into a new function.
This new function does not accept `callback` as arguments, but accepts `thunk` functions.

```js
var Thunk = require('../thunks.js')();
var fs = require('fs');
var fsStat = Thunk.thunkify(fs.stat);

fsStat('thunks.js')(function (error, result) {
  console.log('thunks.js: ', result);
});
fsStat('.gitignore')(function (error, result) {
  console.log('.gitignore: ', result);
});
```

You may also write code with `this`:

```js
var obj = {a: 8};
function run(x, callback) {
  //...
  callback(null, this.a * x);
};

var run = Thunk.thunkify.call(obj, run);

run(1)(function (error, result) {
  console.log('run 1: ', result);
});
run(2)(function (error, result) {
  console.log('run 2: ', result);
});
```

### Thunk.delay(delay)

Return a `thunk` function, this `thunk` function will be called after `delay` milliseconds.

```js
console.log('Thunk.delay 500: ', Date.now());
Thunk.delay(500)(function () {
  console.log('Thunk.delay 1000: ', Date.now());
  return Thunk.delay(1000);
})(function () {
  console.log('Thunk.delay end: ', Date.now());
});
```

You may also write code with `this`:

```js
console.log('Thunk.delay start: ', Date.now());
Thunk.delay.call(this, 1000)(function () {
  console.log('Thunk.delay end: ', Date.now());
});
```
