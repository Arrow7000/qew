/// <reference path="basics.d.ts" />


function isGroupTask<T>(task: SingleTask<T> | GroupTask<T>): task is GroupTask<T> {
    return !!task.isGroupTask;
}

function isNotDone(slot: GroupResult<any> | null): boolean {
    return !slot;
}

function makeSingleTask<T>(func: AsyncFunc<T>, callback: Callback<T>): SingleTask<T> {
    return {
        func,
        isGroupTask: false,
        callback,
        done: false,
    };
}

function makeGroupTask<T>(func: AsyncFunc<T>, groupCallback: GroupCallback<T>, groupId: number, index: number): GroupTask<T> {
    return {
        func,
        isGroupTask: true,
        groupCallback,
        done: false,
        groupId,
        index
    };
}

function makeCallback<T>(resolve: resolve<T>, reject: reject): Callback<T> {
    return (error: Error, result: T) => {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    };
}

function makeGroupCallback<T>(resolve): GroupCallback<T> {
    return (resultArray) => {
        resolve(resultArray);
    };
}


class Qew<T> {
    /**
     * Set by user
     * Not intended to be mutable
     */
    private max: number;
    private delay: delay;

    private tasks: taskHolder<any>;
    private executing: Array<SingleTask<T> | GroupTask<T>>;
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

    public push(funcs: AsyncFunc<T>[], cb: GroupCallback<T>): this;
    public push(func: AsyncFunc<T>, cb: Callback<T>): this;
    public push(funcOrFuncs: AsyncFunc<T> | AsyncFunc<T>[], callback: Callback<T> | GroupCallback<T>) {

        if (Array.isArray(funcOrFuncs)) {

            const funcs = funcOrFuncs;
            if (funcs.length < 1) {

            }
            const tasks: GroupTask<T>[] = funcs.map((func, i) => {
                return makeGroupTask(func, <GroupCallback<T>>callback, this.groupId, i);

            });

            this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(null);

            this.groupId++;
            this.tasks = [...this.tasks, tasks];

        } else {
            const func = funcOrFuncs;
            const task: SingleTask<T> = makeSingleTask(func, <Callback<T>>callback);

            this.tasks = [...this.tasks, task];
        }

        this.tryMove();

        return this;
    }

    public pushProm<T>(funcs: AsyncFunc<T>[]): Promise<(GroupResult<T>[])>;
    public pushProm<T>(func: AsyncFunc<T>): Promise<T>;
    public pushProm<T>(funcOrFuncs: AsyncFunc<T> | AsyncFunc<T>[]): Promise<GroupResult<T>[] | T> {
        if (Array.isArray(funcOrFuncs)) {
            const funcs = funcOrFuncs;

            if (funcs.length < 1) { // is empty array
                return Promise.resolve([]);
            }

            let groupCallback: GroupCallback<T>;
            const promToReturn: Promise<GroupResult<T>[]> = new Promise(resolve => {
                groupCallback = makeGroupCallback(resolve);
            });
            const tasks: GroupTask<T>[] = funcs.map((func, i) => {
                return makeGroupTask(func, groupCallback, this.groupId, i);
            });

            this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(null);

            this.groupId++;
            this.tasks = [...this.tasks, tasks];

            this.tryMove();

            return promToReturn;
        } else {
            const func = funcOrFuncs;

            let callback: Callback<T>;
            const promToReturn: Promise<T> = new Promise((resolve, reject) => {
                callback = makeCallback(resolve, reject);
            });

            const task: SingleTask<T> = makeSingleTask(func, callback);

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
            const group = nextUp;
            const groupDoneAfterThis = group.length < 2;
            const task = group[0];
            if (task) {
                if (groupDoneAfterThis) {
                    this.tasks = this.tasks.slice(1);
                } else {
                    const restGroupTasks = group.slice(1);
                    const otherTasks = this.tasks.slice(1);
                    this.tasks = [...otherTasks, restGroupTasks];
                }

                this.executing = [...this.executing, task]; // push task to executing
                this.execute(task);
            } else {
                // handle group being empty
            }
        } else {
            const task = nextUp;
            this.tasks = this.tasks.slice(1); // remove task from waiting list
            this.executing = [...this.executing, task]; // push task to executing
            this.execute(task);
        }

        this.tryMove();
    }

    private execute(task: SingleTask<T> | GroupTask<T>) {
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

    private doAfterEach(task: SingleTask<T> | GroupTask<T>) {
        const delayMs = typeof this.delay === 'function' ? this.delay() : this.delay;
        setTimeout(() => {
            task.done = true;
            this.executing = this.executing.filter(task => !task.done); // clean up

            this.tryMove();
        }, delayMs);
    }

    private doAfterEachGroupTask(task: GroupTask<T>) {
        const { groupId, groupCallback } = task;
        const groupResults = this.groupResultHolders[groupId];
        const allDone = !groupResults.some(isNotDone);
        if (allDone) {
            groupCallback(groupResults);
            delete this.groupResultHolders[groupId];
        }
    }
}

export = Qew;

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
