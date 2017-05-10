"use strict";
var Queue = (function () {
    function Queue(concurrencyMax, onFulfilled, onRejected) {
        this.idCounter = 0;
        this.tasks = [];
        this.executing = [];
        this.max = concurrencyMax;
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
    }
    Queue.prototype.push = function (func, onFulfilled, onRejected) {
        var _this = this;
        if (func.length) {
            func.forEach(function (func) {
                _this.addTask(func, onFulfilled, onRejected);
            });
        }
        else {
            this.addTask(func, onFulfilled, onRejected);
        }
    };
    Queue.prototype.addTask = function (func, onFulfilled, onRejected) {
        this.idCounter++;
        var task = {
            func: func,
            onFulfilled: onFulfilled,
            onRejected: onRejected,
            done: false,
            id: this.idCounter
        };
        this.tasks = this.tasks.concat([task]);
        this.tryMove();
    };
    Queue.prototype.execute = function (task) {
        var _this = this;
        var func = task.func, onFulfilled = task.onFulfilled, onRejected = task.onRejected;
        var fulfill = onFulfilled || this.onFulfilled;
        var reject = onRejected || this.onRejected;
        func()
            .then(function (result) {
            fulfill(result);
            _this.numFulfilled++;
            _this.doAfterEach(task);
        })
            .catch(function (error) {
            reject(error);
            _this.numRejected++;
            _this.doAfterEach(task);
        });
    };
    Queue.prototype.doAfterEach = function (task) {
        task.done = true;
        this.executing = this.executing.filter(function (task) { return !task.done; });
        this.tryMove();
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
