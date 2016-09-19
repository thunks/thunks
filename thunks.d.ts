/**
*  Type definitions for thunks
*  https://github.com/thunks/thunks
*  Definitions by: zensh <https://github.com/zensh>
*/

type primitives = boolean | number | string | Array<any> | Object | void;
type thunkable = ThunkLikeFunction | GeneratorFunction | AsyncFunction | PromiseLike | ToThunk | ToPromise | Generator;
type FunctionWithCallback = FnWithCb0 | FnWithCb1 | FnWithCb2 | FnWithCb3 | FnWithCb4 | FnWithCb5 | FnWithCb6 | FnWithCb7 | FnWithCb8;

interface Callback {
  (err?: Error, res?: primitives): primitives | thunkable;
}

interface ThunkLikeFunction {
  (fn: Callback): void;
}

interface ThunkFunction {
  (fn?: Callback | GeneratorFunction | AsyncFunction): ThunkFunction;
}

// https://github.com/Microsoft/TypeScript/issues/1360
interface NodeCallback {
  (err?: Error, ...args: Array<primitives>): void;
}

interface FnWithCb0 {
  (callback: NodeCallback): void;
}
interface FnWithCb1 {
  (arg1: primitives, callback: NodeCallback): void;
}
interface FnWithCb2 {
  (arg1: primitives, arg2: primitives, callback: NodeCallback): void;
}
interface FnWithCb3 {
  (arg1: primitives, arg2: primitives, arg3: primitives, callback: NodeCallback): void;
}
interface FnWithCb4 {
  (arg1: primitives, arg2: primitives, arg3: primitives, arg4: primitives, callback: NodeCallback): void;
}
interface FnWithCb5 {
  (arg1: primitives, arg2: primitives, arg3: primitives, arg4: primitives, arg5: primitives, callback: NodeCallback): void;
}
interface FnWithCb6 {
  (arg1: primitives, arg2: primitives, arg3: primitives, arg4: primitives, arg5: primitives, arg6: primitives, callback: NodeCallback): void;
}
interface FnWithCb7 {
  (arg1: primitives, arg2: primitives, arg3: primitives, arg4: primitives, arg5: primitives, arg6: primitives, arg7: primitives, callback: NodeCallback): void;
}
interface FnWithCb8 {
  (arg1: primitives, arg2: primitives, arg3: primitives, arg4: primitives, arg5: primitives, arg6: primitives, arg7: primitives, arg8: primitives, callback: NodeCallback): void;
}

interface ToThunk {
  toThunk(): ThunkLikeFunction;
}

interface ToPromise {
  toPromise(): PromiseLike;
}


interface GeneratorFunction extends Function {
  (err?: Error, res?: primitives): Generator;
}

interface GeneratorFunctionConstructor {
  new (...args: string[]): GeneratorFunction;
  (...args: string[]): GeneratorFunction;
  prototype: GeneratorFunction;
}

interface IteratorResult {
  done: boolean;
  value: primitives | thunkable;
}

interface Generator {
  constructor: GeneratorFunctionConstructor;
  next(value?: primitives | thunkable): IteratorResult;
  throw(err?: Error): IteratorResult;
  return(value?: primitives | thunkable): IteratorResult;
}

interface AsyncFunction extends Function {
  (err?: Error, res?: primitives): PromiseLike;
}

interface AsyncFunctionConstructor {
  new (...args: string[]): AsyncFunction;
  (...args: string[]): AsyncFunction;
  prototype: AsyncFunction;
}

interface PromiseLike {
  then(onfulfilled?: (value: primitives | thunkable) => primitives | thunkable, onrejected?: (reason: Error) => primitives | thunkable): PromiseLike;
}

interface SigStop {
  message: string;
  status: number;
  code: string;
}

interface ScopeOnerror {
  (error: Error): Error | boolean | void;
}

interface ScopeOptions {
  onerror?: ScopeOnerror;
  onstop?: (sig: SigStop) => void;
  debug?: (value: any) => void;
}

interface Thunk {
  (thunkable?: primitives | thunkable): ThunkFunction;
  all(...args: Array<thunkable>): ThunkFunction;
  all(array: Array<thunkable>): ThunkFunction;
  all(object: Object): ThunkFunction;
  seq(...args: Array<thunkable>): ThunkFunction;
  seq(array: Array<thunkable>): ThunkFunction;
  race(...args: Array<thunkable>): ThunkFunction;
  race(array: Array<thunkable>): ThunkFunction;
  persist(thunkable: thunkable): ThunkFunction;
  thunkify(FnWithCb: FunctionWithCallback): (...args: Array<primitives>) => ThunkFunction;
  lift(fn: (...args: Array<primitives>) => primitives): (...args: Array<thunkable>) => ThunkFunction;
  delay(Time?: number): ThunkFunction;
  stop(message?: string): void;
  cancel(): void;
}

declare function thunks (options?: ScopeOnerror | ScopeOptions): Thunk;
declare module thunks {
  export const NAME: string;
  export const VERSION: string;
  export const pruneErrorStack: boolean;
  export const thunk: Thunk;
  export function thunks (options?: ScopeOnerror | ScopeOptions): Thunk;
  export function isGeneratorFn(fn: any): boolean;
  export function isAsyncFn(fn: any): boolean;
  export function isThunkableFn(fn: any): boolean;
  export class Scope {
    constructor(options?: ScopeOnerror | ScopeOptions);
  }
}

export = thunks;
