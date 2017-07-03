/// <reference path="basics.d.ts" />


function isGroupTask(task: SingleTask | GroupTask): task is GroupTask {
    return !!task.isGroupTask;
}

function isNotDone(slot: GroupResult<any> | null): boolean {
    return !slot;
}

function makeSingleTask(func: asyncFunc, callback: callback): SingleTask {
    return {
        func,
        isGroupTask: false,
        callback,
        done: false,
    };
}

function makeGroupTask(func: asyncFunc, groupCallback: groupCallback, groupId: number, index: number): GroupTask {
    return {
        func,
        isGroupTask: true,
        groupCallback,
        done: false,
        groupId,
        index
    };
}

function makeCallback<T>(resolve: resolve<T>, reject: reject): callback {
    return (error: Error, result: T) => {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    };
}

function makeGroupCallback<T>(resolve: resolve<T>): groupCallback {
    return (resultArray) => {
        resolve(resultArray);
    };
}


class Qew {
    /**
     * Set by user
     * Not intended to be mutable
     */
    private max: number;
    private delay: delay;

    private tasks: taskHolder;
    private executing: Array<SingleTask | GroupTask>;
    private groupResultHolders: GroupResultsHolder<any>;

    /**
     * Internal state variables
     */
    private groupId: number;

    constructor(maxConcurrent: number = 1, delay: delay = 0) {

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

    public push(funcs: asyncFunc[], cb: groupCallback): this;
    public push(func: asyncFunc, cb: callback): this;
    public push(funcOrFuncs: asyncFunc | asyncFunc[], callback: callback | groupCallback) {

        if (Array.isArray(funcOrFuncs)) {

            const funcs = funcOrFuncs;
            const tasks: GroupTask[] = funcs.map((func, i) => {
                return makeGroupTask(func, <groupCallback>callback, this.groupId, i);

            });

            this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(null);

            this.groupId++;
            this.tasks = [...this.tasks, tasks];

        } else {
            const func = funcOrFuncs;
            const task: SingleTask = makeSingleTask(func, <callback>callback);

            this.tasks = [...this.tasks, task];
        }

        this.tryMove();

        return this;
    }

    public pushProm<T>(funcs: asyncFunc[]): Promise<(GroupResult<T>[])>;
    public pushProm<T>(func: asyncFunc): Promise<T>;
    public pushProm<T>(funcOrFuncs: asyncFunc | asyncFunc[]): Promise<GroupResult<T>[] | T> {
        if (Array.isArray(funcOrFuncs)) {
            const funcs = funcOrFuncs;

            let groupCallback: groupCallback;
            const promToReturn = new Promise((resolve, reject) => {
                groupCallback = makeGroupCallback(resolve);
            });
            const tasks: GroupTask[] = funcs.map((func, i) => {
                return makeGroupTask(func, groupCallback, this.groupId, i);
            });

            this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(null);

            this.groupId++;
            this.tasks = [...this.tasks, tasks];

            this.tryMove();

            return promToReturn;
        } else {
            const func = funcOrFuncs;

            let callback: callback;
            const promToReturn = new Promise((resolve, reject) => {
                callback = makeCallback(resolve, reject);
            });

            const task: SingleTask = makeSingleTask(func, callback);

            this.tasks = [...this.tasks, task];

            this.tryMove();

            return promToReturn;
        }

    }

    private tryMove() {
        const isFree = this.executing.length < this.max;
        const hasWaiting = this.tasks.length > 0;
        if (isFree && hasWaiting) {
            this.move();
        }
    }

    private move() {
        const nextUp = this.tasks[0];

        if (Array.isArray(nextUp)) {

            const groupDoneAfterThis = nextUp.length < 2;
            const task = nextUp[0];

            if (groupDoneAfterThis) {
                this.tasks = this.tasks.slice(1);
            } else {
                const restGroupTasks = nextUp.slice(1);
                const otherTasks = this.tasks.slice(1);
                this.tasks = [...otherTasks, restGroupTasks];
            }

            this.executing = [...this.executing, task]; // push task to executing
            this.execute(task);
        } else {
            const task = nextUp;
            this.tasks = this.tasks.slice(1); // remove task from waiting list
            this.executing = [...this.executing, task]; // push task to executing
            this.execute(task);
        }

        this.tryMove();
    }

    private execute(task: SingleTask | GroupTask) {
        const { func } = task;

        if (isGroupTask(task)) {
            const { groupId, index } = task;

            func()
                .then(result => {
                    this.groupResultHolders[groupId][index] = {
                        error: null,
                        result
                    };

                    this.doAfterEachGroupTask(task);
                    this.doAfterEach(task);
                })
                .catch(error => {
                    this.groupResultHolders[groupId][index] = {
                        error,
                        result: null
                    };

                    this.doAfterEachGroupTask(task);
                    this.doAfterEach(task);
                });

        } else {
            const { callback } = task;

            func()
                .then(result => {
                    callback(null, result);
                    this.doAfterEach(task);
                })
                .catch(error => {
                    callback(error);
                    this.doAfterEach(task);
                });
        }
    }

    private doAfterEach(task: SingleTask | GroupTask) {
        const delayMs = typeof this.delay === 'function' ? this.delay() : this.delay;
        setTimeout(() => {
            task.done = true;
            this.executing = this.executing.filter(task => !task.done); // clean up

            this.tryMove();
        }, delayMs);
    }

    private doAfterEachGroupTask(task: GroupTask) {
        const { groupId, groupCallback } = task;
        const groupResults = this.groupResultHolders[groupId];
        const allDone = !groupResults.some(isNotDone);
        if (allDone) {
            groupCallback(groupResults);
            delete this.groupResultHolders[groupId];
        }
    }
}

export default Qew;

export function isResolved<T>(result: GroupResult<T>): result is GroupSuccessResult<T> {
    return !!(<GroupSuccessResult<T>>result).result;
}

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
