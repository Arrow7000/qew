/// <reference path="basics.d.ts" />
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
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
                if (funcs.length < 1) {
                }
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
                if (funcs.length < 1) {
                    return Promise.resolve([]);
                }
                var groupCallback_1;
                var promToReturn = new Promise(function (resolve) {
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
                var group = nextUp;
                var groupDoneAfterThis = group.length < 2;
                var task = group[0];
                if (task) {
                    if (groupDoneAfterThis) {
                        this.tasks = this.tasks.slice(1);
                    }
                    else {
                        var restGroupTasks = group.slice(1);
                        var otherTasks = this.tasks.slice(1);
                        this.tasks = otherTasks.concat([restGroupTasks]);
                    }
                    this.executing = this.executing.concat([task]); // push task to executing
                    this.execute(task);
                }
                else {
                    // handle group being empty
                }
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
    return Qew;
});
// export function isResolved<T>(result: GroupResult<T>): result is GroupSuccessResult<T> {
//     return !!(<GroupSuccessResult<T>>result).result;
// }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Fldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxvQ0FBb0M7Ozs7Ozs7Ozs7O0lBR3BDLHFCQUF3QixJQUFrQztRQUN0RCxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDOUIsQ0FBQztJQUVELG1CQUFtQixJQUE2QjtRQUM1QyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakIsQ0FBQztJQUVELHdCQUEyQixJQUFrQixFQUFFLFFBQXFCO1FBQ2hFLE1BQU0sQ0FBQztZQUNILElBQUksTUFBQTtZQUNKLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFFBQVEsVUFBQTtZQUNSLElBQUksRUFBRSxLQUFLO1NBQ2QsQ0FBQztJQUNOLENBQUM7SUFFRCx1QkFBMEIsSUFBa0IsRUFBRSxhQUErQixFQUFFLE9BQWUsRUFBRSxLQUFhO1FBQ3pHLE1BQU0sQ0FBQztZQUNILElBQUksTUFBQTtZQUNKLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGFBQWEsZUFBQTtZQUNiLElBQUksRUFBRSxLQUFLO1lBQ1gsT0FBTyxTQUFBO1lBQ1AsS0FBSyxPQUFBO1NBQ1IsQ0FBQztJQUNOLENBQUM7SUFFRCxzQkFBeUIsT0FBbUIsRUFBRSxNQUFjO1FBQ3hELE1BQU0sQ0FBQyxVQUFDLEtBQVksRUFBRSxNQUFTO1lBQzNCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ1IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEIsQ0FBQztRQUNMLENBQUMsQ0FBQztJQUNOLENBQUM7SUFFRCwyQkFBOEIsT0FBTztRQUNqQyxNQUFNLENBQUMsVUFBQyxXQUFXO1lBQ2YsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQztJ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