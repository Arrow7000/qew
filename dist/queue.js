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
var queue = new Queue(2, console.log, console.error);
var _loop_1 = function (i) {
    queue.push(function () { return count(i, Math.random() * 2500); });
};
for (var i = 0; i < 10; i++) {
    _loop_1(i);
}
// Main
var counter = 0;
function count(number, delay) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(number);
            // counter++;
        }, delay);
    });
}
module.exports = Queue;
// class Queue {
//     constructor(maxActive, onComplete, minCount) {
//         this.waiting = [];
//         this.active = [];
//         this.id = 0;
//         this.maxActive = maxActive;
//         this.onComplete = onComplete;
//         this.minCount = minCount;
//         this.results = { done: 0, erred: 0 };
//     }
//     push(boundProm, onFulfilled, onRejected) {
//         const newTask = {
//             id: this.id,
//             fn: boundProm,
//             working: false,
//             onFulfilled,
//             onRejected
//         };
//         this.id = this.id + 1;
//         this.waiting.push(newTask);
//         this.tryMove();
//     }
//     move(task) {
//         this.active.push(task);
//         this.waiting = this.waiting.filter(item => item.id !== task.id);
//     }
//     tryMove() {
//         if (this.active.length < this.maxActive) {
//             if (this.waiting.length > 0) {
//                 this.move(this.waiting[0]);
//             }
//         }
//         this.process();
//     }
//     processSingle(task) {
//         // console.log('Processing task id', task.id);
//         task.working = true;
//         task.fn()
//             .then(result => {
//                 task.onFulfilled(result);
//                 this.results.done++;
//                 cleanup(task);
//                 this.tryMove();
//             })
//             .catch(err => {
//                 task.onRejected(err);
//                 this.results.erred++;
//                 cleanup(task);
//                 this.tryMove();
//             });
//         const cleanup = (task) => {
//             this.active = this.active.filter(item => {
//                 return item.id !== task.id;
//             });
//         }
//     }
//     process() {
//         const hasAny = this.active.length > 0;
//         if (hasAny) {
//             const first = firstInactive(this.active);
//             if (first) this.processSingle(first);
//         } else {
//             if (this.waiting.length >= 1) {
//                 this.tryMove();
//             } else {
//                 const minComplete = this.count() >= this.minCount;
//                 if (minComplete && this.onComplete) {
//                     // console.log('All functions executed');
//                     this.onComplete(this.results);
//                 }
//             }
//         }
//     }
//     count() {
//         const { done, erred } = this.results;
//         return done + erred;
//     }
// }
// function firstInactive(tasks) {
//     if (tasks.length < 1) {
//         return null;
//     }
//     const first = tasks[0];
//     if (first.working) {
//         return firstInactive(tasks.slice(1));
//     }
//     return first;
// } 
