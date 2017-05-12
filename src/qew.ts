type promSuccessResult = any;
type promResult = promSuccessResult | Error;
type callback = (err: Error, result: promSuccessResult) => void;
type groupCallback = (resultArray: GroupResult[]) => void;
type asyncFunc = () => Promise<any>;
type getNumber = () => number;
type delay = number | getNumber;
interface GroupResult {
    result: promSuccessResult | null;
    error: Error | null;
}

interface GroupResultsHolder {
    [groupId: number]: GroupResult[];
}

interface TaskBasic {
    func: asyncFunc;
    done: boolean;
    isGroupTask: boolean;
}
interface GroupTask extends TaskBasic {
    groupCallback: groupCallback;
    groupId: number;
    index: number;
}
interface SingleTask extends TaskBasic {
    callback: callback;
}
type taskHolder = Array<SingleTask | GroupTask[]>;

function isGroupTask(task: SingleTask | GroupTask): task is GroupTask {
    return !!task.isGroupTask;
}

function isNotDone(slot: GroupResult | null) {
    return !slot;
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
    private groupResultHolders: GroupResultsHolder;

    /**
     * Internal state variables
     */
    private inGroup: boolean;
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

    public push(func: asyncFunc, cb: callback): this;
    public push(funcs: asyncFunc[], cb: groupCallback): this;

    public push(funcOrFuncs: asyncFunc | asyncFunc[], callback: callback | groupCallback) {

        if (Array.isArray(funcOrFuncs)) {

            const funcs = funcOrFuncs;
            const tasks: GroupTask[] = funcs.map((func, i) => {
                return {
                    func,
                    isGroupTask: true,
                    groupCallback: <groupCallback>callback,
                    done: false,
                    groupId: this.groupId,
                    index: i
                };
            });

            this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(null);

            this.groupId++;
            this.tasks = [...this.tasks, tasks];

        } else {
            const func = funcOrFuncs;
            const task: SingleTask = {
                func,
                isGroupTask: false,
                callback: <callback>callback,
                done: false,
            };

            this.tasks = [...this.tasks, task];
        }

        this.tryMove();

        return this;
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
                    callback(error, null);
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
        const { groupId, index, groupCallback } = task;
        const groupResults = this.groupResultHolders[groupId];
        const allDone = !groupResults.some(isNotDone);
        if (allDone) {
            groupCallback(groupResults);
            delete this.groupResultHolders[groupId];
        }
    }
}

export = Qew;

/**
 * new Qew API
 *
 * // const qew = new Qew(1, 250)
 * //     .each(eachCallback)
 * //     .group(groupCallback);
 * 
 * qew.push(asyncFunc, eachCallback); // (error, result)
 * qew.push(asyncFunc[], groupCallback); { error, result }[]
 *
 */
// const q = new Qew(2, 100)
