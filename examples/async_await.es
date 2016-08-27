'use strict'

// Try it in Chrome 54.0.2813.0 canary (64-bit) with `enable-javascript-harmony`
const thunk = thunks()

thunk.call({test: 'Test a async function in thunks'}, async function () {
  console.log(111, `${this.test}, start:`)
  console.log(222, await Promise.resolve('await promise in a async function'))

  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => reject('catch promise error in async function'), 1000)
    })
  } catch (err) {
    console.log(333, err)
  }
})(function * () {
  console.log(444, yield async () => 'yield a async function in generator function')
})(function () {
  console.log(555, `${this.test}, finished.`)
})
