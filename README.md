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
 * @param {number} maxConcurrent - Max simultaneous processes
 * @param {number} delay - Delay in ms between end of one function and start of the next
 * @param {function} onResolved - Promise success handler
 * @param {function} onRejected - Promise failure handler
 */
const qew = new Qew(2, 250, onResolved, onRejected);


/** 
 * Example success/error handlers
 */
function onResolved(result, numResolved, numRejected) {
    console.log(`Function result is ${result}`);
    console.log(`So far ${numResolved} promises have resolved, and ${numRejected} have been rejected`);
}

function onRejected(error, numResolved, numRejected) {
    console.error(`Function has failed`, error);
    console.log(`So far ${numResolved} promises have resolved, and ${numRejected} have been rejected`);
}
```

### Pushing jobs

```javascript
/** 
 * Push single function onto stack
 */
const func = () => asyncFunc('param');
qew.push(func); // push an async function to the qew

/** 
 * Push array of functions onto stack
 */
const funcs = [0, 1, 2, 3, 4].map(param => asyncFunc(param));
qew.push(funcs); // push an array of functions
```

You can override the qew-wide success and error handlers by adding them as the 2nd and 3rd parameter respectively when you push a new function onto the stack.

```javascript
const customOnResolved = () => console.log('Winning!');
qew.push(func, customOnResolved);

const customOnRejected = () => console.log('Losing :(');
qew.push(func, onResolved, customOnRejected);
```

This means that if you are planning to add a custom success or failure handler for each function you don't need to initialise the qew with handlers.

```javascript
const qew = new Qew(2); // look ma, no handlers!
qew.push(func, customOnResolved, customOnRejected);
```

### Delay generator

The delay between promises doesn't need to be a hardcoded number, you can also pass in a function that returns a number.

```javascript
const randomDelay = () => 500 + Math.random() * 500;
const qew = new Qew(2, randomDelay);
```

## Contributing

To contribute or report issues please create a pull request or an issue accordingly.