# Qew

A tiny library for queuing and throttling asynchronous functions.

Perfect for managing resource-intensive processes and controlling access to rate-limited APIs.

This project has 0 (zero) dependencies 👌.

![NPM stats](https://nodei.co/npm/qew.png?downloads=true&downloadRank=true&stars=true)

1. [Installation](#installation)
1. [API](#api)
   1. [`Qew.constructor`](#new-qewmaxconcurrency1-delayordelayfunc0)
   1. [`Qew.push`](#qewpushasyncfunction)
1. [Use cases](#use-cases)
1. [Methods & type signatures](#methods-and-type-signatures)
1. [Contributing](#contributing)

## Installation

Qew is available on npm. Install via

```
$ npm install qew
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

```typescript
const Qew = require("qew");

const qew = new Qew(); // maxConcurrency of 1, delay of 0ms
const qew = new Qew(3); // maxConcurrency of 3, delay of 0ms
const qew = new Qew(2, 250); // maxConcurrency of 2, delay of 250ms between end and start of functions
```

The delay parameter doesn't need to be a hardcoded number, you can also pass in a function that returns a number.

```typescript
const getRandomDelay = () => Math.random() * 1000;

const qew = new Qew(2, getRandomDelay);
// maxConcurrency of 2, delay will be a new random value between 0ms and 1000ms
```

### `Qew.push(asyncFunction)`

Type signature

```typescript
Qew.push(asyncFunc: () => Promise<T>): Promise<T>;
```

##### Examples

```typescript
// returns a promise, that runs when it is its turn in the queue.
// will resolve or reject depending on asyncFunc's resolution
const prom = qew.push(asyncFunc);

prom
    .then(result => ...)
    .catch(error => ...);

// `push`'s result can also be `await`ed in an async function like any promise
const doStuff = async () => {
    const result = await qew.push(asyncFunc);
    // do stuff with `result`
}

```

## Use cases

### Accessing rate-limited APIs

Basic example, queuing individual asynchronous functions.

```typescript
const qew = new Qew(1, 100); // for API that has a rate limit of 10 reqs/sec

qew.push(() => accessApi("a")).then(callback);
qew.push(() => accessApi("b")).then(callback);
qew.push(() => accessApi("c")).then(callback);

function callback(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log(result);
}
```

## Methods and type signatures

```typescript
constructor Qew(maxConcurrent: number = 1, delay: number | (() => number) = 0): Qew;

Qew.push(func: () => Promise<T>, cb: (err: Error, result?: T) => void): this;
```

## Contributing

Contributions are welcome! Feel free to file an issue or submit a pull request.
