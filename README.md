# Qew

A library for queuing and throttling asynchronous functions, both individually or in arrays.

Perfect for managing resource-intensive processes and controlling access to rate-limited APIs.

## Installation

Qew is available on npm. Install via 

```
$ npm install --save qew
```

or

```
$ yarn add qew
```

## Examples

### Initialisation

```javascript
const Qew = require('qew');

 /**
 * Initialise new qew
 * @constructor
 * @param {number} [maxConcurrent=1] - Max simultaneous processes
 * @param {number} [delay=0] - Delay in ms between end of one function and start of the next
 */
const qew = new Qew(2, 250);
```

### Pushing jobs

```javascript
/** 
 * Push single function onto stack
 */
const func = () => asyncFunc('param'); // async function/function that returns a promise

qew.push(func, (err, result) => {
    if (err) {
        return console.error(err);
    }

    console.log(result);
});


/** 
 * Push array of functions onto stack
 */
const funcs = [0, 1, 2, 3, 4].map(param => asyncFunc(param)); // array of async functions

qew.push(funcs, resultObjects => {

    for (const resultObj of resultObjects) {

        const { result, error } = resultObj;

        // do stuff with each `result` or `error`
    }
});
```

### Delay generator

The delay parameter doesn't need to be a hardcoded number, you can also pass in a function that returns a number.

```javascript
const randomDelay = () => 500 + Math.random() * 500;
const qew = new Qew(2, randomDelay);
```

## Use cases

### Accessing rate-limited APIs

Basic example, queuing individual asynchronous functions.

```javascript
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

```javascript
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

```javascript
qew.push(['a', 'b', 'c'].map(makeFunc), arrayCallback);
qew.push(['d', 'e', 'f'].map(makeFunc), arrayCallback);
qew.push(['g', 'h', 'i'].map(makeFunc), arrayCallback);
```

## API

```typescript
constructor Qew(maxConcurrent: number = 1, delay: number | (() => number) = 0): Qew;

Qew.push(func: () => Promise<T>, cb: (err: Error, result?: T) => void): this;
Qew.push(funcs: (() => Promise<T>)[], cb: (resultArray: { result: T, error: Error }[]) => void): this;

Qew.pushProm(func: () => Promise<T>): Promise<T>;
Qew.pushProm(funcs:(() => Promise<T>)[]): Promise<{ result: T, error: Error }[]>;
```

## Contributing

To contribute or report issues please create a pull request or an issue accordingly.