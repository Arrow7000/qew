"use strict";
/// <reference path="basics.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
function isGroupTask(task) {
    return !!task.isGroupTask;
}
function isNotDone(slot) {
    return !slot;
}
function makeSingleTask(func, callback) {
    return {
        func: func,
        isGroupTask: false,
        callback: callback,
        done: false,
    };
}
function makeGroupTask(func, groupCallback, groupId, index) {
    return {
        func: func,
        isGroupTask: true,
        groupCallback: groupCallback,
        done: false,
        groupId: groupId,
        index: index
    };
}
function makeCallback(resolve, reject) {
    return function (error, result) {
        if (error) {
            reject(error);
        }
        else {
            resolve(result);
        }
    };
}
function makeGroupCallback(resolve) {
    return function (resultArray) {
        resolve(resultArray);
    };
}
var Qew = (function () {
    function Qew(maxConcurrent, delay) {
        if (maxConcurrent === void 0) { maxConcurrent = 1; }
        if (delay === void 0) { delay = 0; }
        if (maxConcurrent < 1) {
            throw new Error('Max concurrent functions needs to be at least 1');
        }
        this.max = maxConcurrent;
        this.delay = delay;
        this.tasks = [];
        this.executing = [];
        this.groupResultHolders = {};
        this.groupId = 0;
    }
    Qew.prototype.push = function (funcOrFuncs, callback) {
        var _this = this;
        if (Array.isArray(funcOrFuncs)) {
            var funcs = funcOrFuncs;
            var tasks = funcs.map(function (func, i) {
                return makeGroupTask(func, callback, _this.groupId, i);
            });
            this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(null);
            this.groupId++;
            this.tasks = this.tasks.concat([tasks]);
        }
        else {
            var func = funcOrFuncs;
            var task = makeSingleTask(func, callback);
            this.tasks = this.tasks.concat([task]);
        }
        this.tryMove();
        return this;
    };
    Qew.prototype.pushProm = function (funcOrFuncs) {
        var _this = this;
        if (Array.isArray(funcOrFuncs)) {
            var funcs = funcOrFuncs;
            var groupCallback_1;
            var promToReturn = new Promise(function (resolve, reject) {
                groupCallback_1 = makeGroupCallback(resolve);
            });
            var tasks = funcs.map(function (func, i) {
                return makeGroupTask(func, groupCallback_1, _this.groupId, i);
            });
            this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(null);
            this.groupId++;
            this.tasks = this.tasks.concat([tasks]);
            this.tryMove();
            return promToReturn;
        }
        else {
            var func = funcOrFuncs;
            var callback_1;
            var promToReturn = new Promise(function (resolve, reject) {
                callback_1 = makeCallback(resolve, reject);
            });
            var task = makeSingleTask(func, callback_1);
            this.tasks = this.tasks.concat([task]);
            this.tryMove();
            return promToReturn;
        }
    };
    Qew.prototype.tryMove = function () {
        var isFree = this.executing.length < this.max;
        var hasWaiting = this.tasks.length > 0;
        if (isFree && hasWaiting) {
            this.move();
        }
    };
    Qew.prototype.move = function () {
        var nextUp = this.tasks[0];
        if (Array.isArray(nextUp)) {
            var groupDoneAfterThis = nextUp.length < 2;
            var task = nextUp[0];
            if (groupDoneAfterThis) {
                this.tasks = this.tasks.slice(1);
            }
            else {
                var restGroupTasks = nextUp.slice(1);
                var otherTasks = this.tasks.slice(1);
                this.tasks = otherTasks.concat([restGroupTasks]);
            }
            this.executing = this.executing.concat([task]); // push task to executing
            this.execute(task);
        }
        else {
            var task = nextUp;
            this.tasks = this.tasks.slice(1); // remove task from waiting list
            this.executing = this.executing.concat([task]); // push task to executing
            this.execute(task);
        }
        this.tryMove();
    };
    Qew.prototype.execute = function (task) {
        var _this = this;
        var func = task.func;
        if (isGroupTask(task)) {
            var groupId_1 = task.groupId, index_1 = task.index;
            func()
                .then(function (result) {
                _this.groupResultHolders[groupId_1][index_1] = {
                    error: null,
                    result: result
                };
                _this.doAfterEachGroupTask(task);
                _this.doAfterEach(task);
            })
                .catch(function (error) {
                _this.groupResultHolders[groupId_1][index_1] = {
                    error: error,
                    result: null
                };
                _this.doAfterEachGroupTask(task);
                _this.doAfterEach(task);
            });
        }
        else {
            var callback_2 = task.callback;
            func()
                .then(function (result) {
                callback_2(null, result);
                _this.doAfterEach(task);
            })
                .catch(function (error) {
                callback_2(error);
                _this.doAfterEach(task);
            });
        }
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
    Qew.prototype.doAfterEachGroupTask = function (task) {
        var groupId = task.groupId, groupCallback = task.groupCallback;
        var groupResults = this.groupResultHolders[groupId];
        var allDone = !groupResults.some(isNotDone);
        if (allDone) {
            groupCallback(groupResults);
            delete this.groupResultHolders[groupId];
        }
    };
    return Qew;
}());
exports.default = Qew;
function isResolved(result) {
    return !!result.result;
}
exports.isResolved = isResolved;
/**
 * new Qew API
 *
 * // const qew = new Qew(1, 250)
 * //     .each(eachCallback)
 * //     .group(groupCallback);
 *
 * qew.push(asyncFunc, eachCallback: (error, result): void): this;
 * qew.push(asyncFunc[], groupCallback: ({ error, result }[]): void): this;
 *
 * qew.pushProm(asyncFunc): Promise<any, any>;
 * qew.pushProm(asyncFunc[]): Promise<({ error, result })[]>;
 *
 */
// const q = new Qew(2, 100)
