// Type definitions for thunks
//
// https://github.com/thunks/thunks
// Definitions by: zensh <https://github.com/zensh>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// declare var thunks: Thunks;

declare module "thunks" {
  export = Thunks;

  interface ErrorHandler {
    (error: any): boolean | void;
  }

  interface CallbackHandler {
    (error?: any, ...rest: any[]): void;
  }

  interface Thunk {
    (callback: CallbackHandler): Thunk | void;
  }

// // PromiseLike
// interface Thenable<R> {
//   then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Thenable<U>;
//   then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => void): Thenable<U>;
// }

  interface ThunkableObject {
    toThunk(): Thunk;
  }

  // https://github.com/Microsoft/TypeScript/issues/2873
  interface Generator<T> {

  }

  type Thunkable = Generator<any> | PromiseLike<any> | ThunkableObject | Thunk;

  interface ThunksOptions {
    onerror?: ErrorHandler;
    onstop?: (sig: any) => void;
    debug?: (error: any, ...rest: any[]) => void;
  }

  interface Thunk {
    (error: any, ...rest: any[]): Thunk;
  }

  interface ThunkGenerater {
    (thunkable: any): Thunk;

    all(object: Object): Thunk;
    all(array: Array<any>): Thunk;
    all(...rest: any[]): Thunk;

    seq(array: Array<any>): Thunk;
    seq(...rest: any[]): Thunk;

    race(array: Array<any>): Thunk;
    race(...rest: any[]): Thunk;

    digest(...rest: any[]): Thunk;

    thunkify(fn: Function): Thunk;
    lift(fn: Function): Thunk;
    delay(number: number): Thunk;
    stop(message: string): Thunk;
    persist(thunkable: any): Thunk;
  }

  interface Thunks {
    (err: ErrorHandler): ThunkGenerater;
    (options: ThunksOptions): ThunkGenerater;
    NAME: string;
    VERSION: string;
  }

}
