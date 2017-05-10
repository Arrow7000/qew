"use strict";
// interface QewOpts {
//     onResolved: onComplete;
//     onRejected: onComplete;
// }
var Queue = (function () {
    function Queue(maxConcurrent, delay, onResolved, onRejected) {
        if (maxConcurrent === void 0) { maxConcurrent = 1; }
        if (delay === void 0) { delay = 0; }
        if (onResolved === void 0) { onResolved = null; }
        if (onRejected === void 0) { onRejected = null; }
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
        this.done = this.done.bind(this);
    }
    Queue.prototype.push = function (func, onResolved, onRejected) {
        var _this = this;
        if (this.isDone) {
            throw new Error('Cannot push onto finished queue');
        }
        if (func.length) {
            func.forEach(function (func) {
                _this.addTask(func, onResolved, onRejected);
            });
        }
        else {
            this.addTask(func, onResolved, onRejected);
        }
    };
    Queue.prototype.done = function () {
        this.isDone = true;
        this.tasks = [];
        this.executing = [];
    };
    Queue.prototype.addTask = function (func, onResolved, onRejected) {
        var task = {
            func: func,
            onResolved: onResolved,
            onRejected: onRejected,
            done: false,
        };
        this.tasks = this.tasks.concat([task]);
        this.tryMove();
    };
    Queue.prototype.execute = function (task) {
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
    Queue.prototype.doAfterEach = function (task) {
        var _this = this;
        var delayMs = typeof this.delay === 'function' ? this.delay() : this.delay;
        setTimeout(function () {
            task.done = true;
            _this.executing = _this.executing.filter(function (task) { return !task.done; });
            _this.tryMove();
        }, delayMs);
    };
    Queue.prototype.move = function () {
        if (this.executing.length >= this.max) {
            throw new Error("Cannot add more than " + this.max + " tasks to execute simultaneously");
        }
        if (this.tasks.length < 1) {
            throw new Error("No more tasks to load");
        }
        var len = this.tasks.length - 1; // get index of last task
        var task = this.tasks[len]; // get last task
        this.tasks = this.tasks.slice(0, len); // remove task from tasks list
        this.executing = this.executing.concat([task]); // add task to executing list
        this.execute(task);
    };
    Queue.prototype.tryMove = function () {
        if (this.executing.length < this.max && this.tasks.length > 0) {
            this.move();
        }
    };
    return Queue;
}());
module.exports = Queue;
