# Qew

A library for queuing and limiting simultaneous asynchronous functions. Perfect for memory intensive operations or accessing rate-limited APIs.

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
const func = () => asyncFunc('param');
qew.push(func, (err, result) => {
    if (err) {
        return console.error(err);
    }

    console.log(result);
});

/** 
 * Push array of functions onto stack
 */
const funcs = [0, 1, 2, 3, 4].map(param => asyncFunc(param));
qew.push(funcs, resultObjs => {

    for (const resultObj in resultObjs) {

        const { result, error } = resultObj;

        // do stuff with each `result` or `error`
    }
});
```

### Delay generator

The delay between promises doesn't need to be a hardcoded number, you can also pass in a function that returns a number.

```javascript
const randomDelay = () => 500 + Math.random() * 500;
const qew = new Qew(2, randomDelay);
```

## Contributing

To contribute or report issues please create a pull request or an issue accordingly.