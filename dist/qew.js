"use strict";
var doNothing = function () { return null; };
var Qew = (function () {
    function Qew(maxConcurrent, delay, onResolved, onRejected, onDone) {
        if (maxConcurrent === void 0) { maxConcurrent = 1; }
        if (delay === void 0) { delay = 0; }
        if (onResolved === void 0) { onResolved = null; }
        if (onRejected === void 0) { onRejected = null; }
        if (onDone === void 0) { onDone = doNothing; }
        if (maxConcurrent < 1) {
            throw new Error('Max concurrent functions needs to be at least 1');
        }
        this.max = maxConcurrent;
        this.delay = delay;
        this.onResolved = onResolved;
        this.onRejected = onRejected;
        this.tasks = [];
        this.executing = [];
        this.numFulfilled = 0;
        this.numRejected = 0;
        this.isDone = false;
        this.minDone = null;
        this.minDoneSuccess = false;
        this.onDone = onDone;
        this.done = this.done.bind(this);
    }
    Qew.prototype.push = function (func, onResolved, onRejected) {
        var _this = this;
        if (this.isDone) {
            throw new Error('Cannot push onto finished qew');
        }
        if (Array.isArray(func)) {
            func.forEach(function (func) {
                _this.addTask(func, onResolved, onRejected);
            });
        }
        else {
            this.addTask(func, onResolved, onRejected);
        }
        return this;
    };
    Qew.prototype.done = function (afterNum, onlySuccess) {
        if (afterNum === void 0) { afterNum = null; }
        if (onlySuccess === void 0) { onlySuccess = false; }
        if (!this.isDone) {
            if (afterNum) {
                this.minDone = afterNum;
                this.minDoneSuccess = onlySuccess;
            }
            else {
                this.isDone = true;
                this.tasks = [];
                this.executing = [];
                this.onDone(this.numFulfilled, this.numRejected);
            }
        }
        return this;
    };
    Qew.prototype.addTask = function (func, onResolved, onRejected) {
        var task = {
            func: func,
            onResolved: onResolved,
            onRejected: onRejected,
            done: false,
        };
        this.tasks = this.tasks.concat([task]);
        this.tryMove();
    };
    Qew.prototype.execute = function (task) {
        var _this = this;
        var func = task.func, onResolved = task.onResolved, onRejected = task.onRejected;
        var fulfill = onResolved || this.onResolved;
        var reject = onRejected || this.onRejected;
        func()
            .then(function (result) {
            _this.numFulfilled++;
            fulfill(result, _this.numFulfilled, _this.numRejected, _this.done);
            _this.doAfterEach(task);
        })
            .catch(function (error) {
            _this.numRejected++;
            reject(error, _this.numFulfilled, _this.numRejected, _this.done);
            _this.doAfterEach(task);
        });
    };
    Qew.prototype.doAfterEach = function (task) {
        var _this = this;
        var delayMs = typeof this.delay === 'function' ? this.delay() : this.delay;
        setTimeout(function () {
            task.done = true;
            _this.executing = _this.executing.filter(function (task) { return !task.done; }); // clean up
            _this.tryMove();
        }, delayMs);
    };
    Qew.prototype.move = function () {
        var task = this.tasks[0]; // get task
        this.tasks = this.tasks.slice(1); // remove task from waiting list
        this.executing = this.executing.concat([task]); // push task to executing
        this.execute(task);
    };
    Qew.prototype.tryMove = function () {
        var isFree = this.executing.length < this.max;
        var hasWaiting = this.tasks.length > 0;
        var numDone = this.numFulfilled;
        if (this.minDoneSuccess) {
            numDone += this.numRejected;
        }
        var isDone = this.minDone && numDone >= this.minDone;
        if (isDone) {
            this.done();
        }
        else if (isFree && hasWaiting) {
            this.move();
        }
    };
    return Qew;
}());
var qew = new Qew();
module.exports = Qew;
