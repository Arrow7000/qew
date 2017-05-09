"use strict";
var Queue = (function () {
    // private preExecute: asyncFunc[];
    function Queue(concurrencyMax, onFulfilled, onRejected) {
        this.max = concurrencyMax;
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
    }
    Queue.prototype.push = function (func) {
    };
    Queue.prototype.execute = function (func) {
        var _this = this;
        func()
            .then(function (result) {
            _this.onFulfilled(result);
            _this.numFulfilled++;
        })
            .catch(function (error) {
            _this.onRejected(error);
            _this.numRejected++;
        });
    };
    return Queue;
}());
var queue = new Queue(2, console.log, console.error);
queue.push(function () { return count(1000); });
queue.push(function () { return count(1000); });
queue.push(function () { return count(1000); });
queue.push(function () { return count(1000); });
queue.push(function () { return count(1000); });
queue.push(function () { return count(1000); });
// Main
var counter = 0;
function count(delay) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(counter);
            counter++;
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
