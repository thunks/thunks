thunks
====
A small and magical async control flow tool, wrap promise, generator and anything to thunk.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Talk topic][talk-image]][talk-url]

[中文说明](https://github.com/thunks/thunks/blob/master/README_zh.md)

[thunks 的作用域和异常处理设计](https://github.com/thunks/thunks/blob/master/docs/scope-and-error-catch.md)

## Compatibility

ES3+, support node.js and all browsers.

## Implementations:

- [Toa](https://github.com/toajs/toa): A powerful web framework rely on thunks.
- [thunk-redis](https://github.com/thunks/thunk-redis) A thunk/promise-based redis client with pipelining and cluster.
- [thunk-stream](https://github.com/thunks/thunk-stream) Wrap a readable/writable/duplex/transform stream to a thunk.
- [thunk-queue](https://github.com/thunks/thunk-queue) Thunk queue for uncertainty tasks evaluation.
- [file-cache](https://github.com/thunks/file-cache) Read file with caching, rely on thunks.

And a mountain of applications in server-side or client-side.

## What is a thunk?

1. **`thunk`** is a function that encapsulates synchronous or asynchronous code inside.

2. **`thunk`** accepts only one `callback` function as an arguments, which is a CPS function;

3. **`thunk`** returns another **`thunk`** function after being called, for chaining operations;

4. **`thunk`** would passing the results into a `callback` function after excuted.

5. If `callback` returns a new **`thunk`** function, then it would be send to another **`thunk`** to excute,
or it would be send to another new **`thunk`** function as the value of the computation.

## Benchmark

```js
➜  thunks git:(master) ✗ node benchmark/index
Async Benchmark...

JSBench Start (1000 cycles, async mode):
Test Promise...
Test co...
Test thunks-generator...
Test bluebird...
Test when...
Test RSVP...
Test async...
Test thenjs...
Test thunks...

JSBench Results:
Promise: 1000 cycles, 34.467 ms/cycle, 29.013 ops/sec
co: 1000 cycles, 29.833 ms/cycle, 33.520 ops/sec
thunks: 1000 cycles, 15.671 ms/cycle, 63.812 ops/sec
thunks-generator: 1000 cycles, 14.268 ms/cycle, 70.087 ops/sec
bluebird: 1000 cycles, 12.722 ms/cycle, 78.604 ops/sec
RSVP: 1000 cycles, 10.06 ms/cycle, 99.404 ops/sec
when: 1000 cycles, 9.708 ms/cycle, 103.008 ops/sec
async: 1000 cycles, 8.755 ms/cycle, 114.220 ops/sec
thenjs: 1000 cycles, 5.597 ms/cycle, 178.667 ops/sec

Promise: 100%; co: 115.53%; thunks: 219.94%; thunks-generator: 241.57%; bluebird: 270.92%; RSVP: 342.61%; when: 355.04%; async: 393.68%; thenjs: 615.81%;

JSBench Completed!
```

## Demo

```js
var Thunk = require('../thunks.js')();
var fs = require('fs');

var size = Thunk.thunkify(fs.stat);

// sequential
size('.gitignore')(function (error, res) {
  console.log(error, res);
  return size('thunks.js');

})(function (error, res) {
  console.log(error, res);
  return size('package.json');

})(function (error, res) {
  console.log(error, res);
})

// parallel
Thunk.all([size('.gitignore'), size('thunks.js'), size('package.json')])(function (error, res) {
  console.log(error, res);
})

// sequential
Thunk.seq([size('.gitignore'), size('thunks.js'), size('package.json')])(function (error, res) {
  console.log(error, res);
})
```

```js
var Thunk = require('../thunks.js')();
var fs = require('fs');

var size = Thunk.thunkify(fs.stat);


// generator
Thunk(function* () {

  // sequential
  console.log(yield size('.gitignore'));
  console.log(yield size('thunks.js'));
  console.log(yield size('package.json'));

})(function* (error, res) {
  //parallel
  console.log(yield [size('.gitignore'), size('thunks.js'), size('package.json')]);
})();
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

5. Generator and Generator Function, like `co`, and `yield` anything

    ```js
    Thunk(function* () {
      var x = yield 10;
      return 2 * x;
    })(function* (error, res) {
      console.log(error, res); // null, 20

      return yield [1, 2, Thunk(3)];
    })(function* (error, res) {
      console.log(error, res); // null, [1, 2, 3]
      return yield {
        name: 'test',
        value: Thunk(1)
      };
    })(function (error, res) {
      console.log(error, res); // null, {name: 'test', value: 1}
    });
    ```

6. values in other types would be valid results passing to a new `thunk` function

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
### Thunk.all(thunk1, ..., thunkX)

Returns a `thunk` function.

`obj` can be an array or an object that contains any value. `Thunk.all` will transform value to a `thunk` function and excuted it in parallel. After all of them are finished, an array containing results(in its original order) would be passed to the a new `thunk` function.

```js
Thunk.all([
  Thunk(0),
  function* () { return yield 1; },
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
  [Thunk('d'), function* () { return yield 'e'; }], // thunk in array will be excuted in parallel
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

### Thunk.race([thunk1, ..., thunkX])
### Thunk.race(thunk1, ..., thunkX)

Returns a `thunk` function with the value or error from one first completed.

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

### Thunk.stop([messagge])

This will stop thunk function with a message similar to Promise's cancelable(not implement yet). It will throw a stop signal object.
Stop signal is a Error object with a message and `status === 19`(POSIX signal SIGSTOP) and a special code, stop signal can be caught by `debug`.

```js
var Thunk = require('thunks')({
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
```

```js
Thunk.delay(100)(function() {
  console.log('Hello');
  return Thunk.delay(100)(function() {
    Thunk.stop('Stop now!');
    console.log('It will not be run!');
  });
})(function(error, value) {
  console.log('It will not be run!');
});
```

## Who's using

+ Teambition community: https://bbs.teambition.com/ use in server-side and client-side

[npm-url]: https://npmjs.org/package/thunks
[npm-image]: http://img.shields.io/npm/v/thunks.svg

[travis-url]: https://travis-ci.org/thunks/thunks
[travis-image]: http://img.shields.io/travis/thunks/thunks.svg

[talk-url]: https://guest.talk.ai/rooms/d1ccbf802n
[talk-image]: https://img.shields.io/talk/t/d1ccbf802n.svg
