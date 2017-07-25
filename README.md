# Qew

A library for queuing and throttling asynchronous functions, both individually or in arrays.

Perfect for managing resource-intensive processes and controlling access to rate-limited APIs.

![NPM stats](https://nodei.co/npm/qew.png?downloads=true&downloadRank=true&stars=true)
![NPM downloads histogram](https://nodei.co/npm-dl/qew.png?months=1&height=2)

1. [Installation](#installation)
1. [API](#api)
    1. [`Qew.constructor`](#new-qewmaxconcurrency1-delayordelayfunc0)
    1. [`Qew.push`](#qewpush)
    1. [`Qew.pushProm`](#qewpushprom)
1. [Use cases](#use-cases)
1. [Methods & type signatures](#methods-and-type-signatures)
1. [Contributing](#contributing)

## Installation

Qew is available on npm. Install via 

```
$ npm install --save qew
```

or

```
$ yarn add qew
```
## API

### `new Qew(maxConcurrency=1, delayOrDelayFunc=0)`

The constructor's type signature is 
```typescript
constructor Qew(maxConcurrency: number = 1, delay: number | (() => number) = 0): Qew;
```

#### Examples

```js
const Qew = require('qew');

const qew = new Qew(); // maxConcurrency of 1, delay of 0ms
const qew = new Qew(3); // maxConcurrency of 3, delay of 0ms
const qew = new Qew(2, 250); // maxConcurrency of 2, delay of 250ms between end and start of functions
```

The delay parameter doesn't need to be a hardcoded number, you can also pass in a function that returns a number.

```js
function randomDelay() {
    return (Math.random() * 500) + 500;
}

const qew = new Qew(2, randomDelay);
// maxConcurrency of 2, delay will be a new random value between 500ms and 1000ms
```
### `Qew.push`

#### `Qew.push(asyncFunction, callback)` &mdash; single function

Type signature

```typescript
Qew.push(func: () => Promise<T>, cb: (err: Error, result?: T) => void): this;
```

##### Examples

```js
// async function/function that returns a promise
async function asyncFunc() {
    await ...;
    return ...;
}
// OR
function asyncFunc() {
    return new Promise((resolve, reject) => { ... });
}

// error-first callback function
function callback(error, result) {
    if (error) { 
        ...
    } else {
        ...
    }
}

// Push function with callback
qew.push(asyncFunc, callback);
```

#### `Qew.push(asyncFunction[], arrayCallback)` &mdash; array of functions

Type signature

```typescript
Qew.push(funcs: (() => Promise<T>)[], cb: (resultArray: { result: T, error: Error }[]) => void): this;
```

#### Examples

```js
const funcs = [asyncFunc0, asyncFunc1, asyncFunc2, asyncFunc3];

function arrayCallback(resultObjects) {
    // `resultObjects` is an array of shape `{ error, result }[]`

    for (const obj of resultObjects) {
        const { error, result } = obj;
        // if has error, `result === null`, if no error, `error === null`
        
        ... // do something with either error or result
    }
}

// push functions array and callback
qew.push(funcs, arrayCallback);
```
### `Qew.pushProm`

#### `Qew.pushProm(asyncFunction)` &mdash; single function

Type signature

```typescript
Qew.pushProm(func: () => Promise<T>): Promise<T>;
```

##### Examples

```js
// returns a promise, that runs when it is its turn in the queue.
// will resolve or reject depending on asyncFunc's resolution
const prom = Qew.pushProm(asyncFunc);

prom
    .then(result => ...)
    .catch(error => ...);
```

#### `Qew.pushProm(asyncFunction[])` &mdash; array of functions

Type signature

```typescript
Qew.pushProm(funcs:(() => Promise<T>)[]): Promise<{ result: T, error: Error }[]>;
```

##### Examples

```js
// prom will always resolve, with an array of objects that have shape { error, result }[]
// if an async function rejected, its `result` property will be `null` and it will have an error
// if an async function resolved, its `error` prop will be `null` and its `result` prop will contain the resolved value
const prom = Qew.pushProm([asyncFunc0, asyncFunc1, asyncFunc2]);

prom.then(resultObjects => ...);
```

## Use cases

### Accessing rate-limited APIs

Basic example, queuing individual asynchronous functions.

```js
const qew = new Qew(1, 100); // for API that has a rate limit of 10 reqs/sec

qew.push(() => accessApi('a'), callback);
qew.push(() => accessApi('b'), callback);
qew.push(() => accessApi('c'), callback);


function callback(err, result) {
    if (err) {
        return console.error(err);
    }
    console.log(result);
}
```

Where it gets really powerful is with grouping sets of operations together, e.g. firing off groups of API requests for various users, where one user needs a group of multiple requests each.

Qew allows you to group sets of operations together and then allow you to do something with the array of the results; kind of like `Promise.all` but with controlled throttling.

```js
const qew = new Qew(1, 100); // for API that has a rate limit of 10 reqs/sec

const funcsArray = ['a', 'b', 'c'].map(char => {
    return () => accessApi(char);
});

qew.push(funcsArray, arrayCallback);


function arrayCallback(responses) { // responses will be an array of objects with schema [{ result, error }]
    const successResults = responses
        .filter(response => !response.error) // return only successful results
        .map(response => response.result); // get the result from the response object

    console.log(successResults);
}
```

The `qew` object can be reused for multiple arrays, so that even requests from multiple users will be throttled according to the concurrency and rate limit specified in the constructor.

```js
qew.push(['a', 'b', 'c'].map(makeFunc), arrayCallback);
qew.push(['d', 'e', 'f'].map(makeFunc), arrayCallback);
qew.push(['g', 'h', 'i'].map(makeFunc), arrayCallback);
```

## Methods and type signatures

```typescript
constructor Qew(maxConcurrent: number = 1, delay: number | (() => number) = 0): Qew;

Qew.push(func: () => Promise<T>, cb: (err: Error, result?: T) => void): this;
Qew.push(funcs: (() => Promise<T>)[], cb: (resultArray: { result: T, error: Error }[]) => void): this;

Qew.pushProm(func: () => Promise<T>): Promise<T>;
Qew.pushProm(funcs:(() => Promise<T>)[]): Promise<{ result: T, error: Error }[]>;
```

## Contributing

To contribute or report issues please create a pull request or an issue accordingly.
