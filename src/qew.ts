type onComplete = (promResult: any, numFulfilled: number, numRejected: number, done: () => void) => void;
type onDone = (numFulfilled: number, numRejected: number) => void;
type asyncFunc = () => Promise<any>;
type taskHolder = Task[];
type getNumber = () => number;
type delay = number | getNumber;
interface Task {
    func: asyncFunc;
    onResolved: onComplete;
    onRejected: onComplete;
    done: boolean;
}

const doNothing = () => null;


class Qew {
    /**
     * Set by user
     * Not intended to be mutable
     */
    private max: number;
    private delay: delay;
    private isDone: boolean;
    private onResolved: onComplete;
    private onRejected: onComplete;
    private tasks: taskHolder;
    private executing: taskHolder;
    private minDone: number;
    private minDoneSuccess: boolean;
    private onDone: onDone;

    /**
     * Internal state variables
     */
    private numFulfilled: number;
    private numRejected: number;

    constructor(maxConcurrent: number = 1,
        delay: delay = 0,
        onResolved: onComplete = null,
        onRejected: onComplete = null,
        onDone: onDone = doNothing) {
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

    public push(func: asyncFunc | asyncFunc[], onResolved?: onComplete, onRejected?: onComplete) {
        if (this.isDone) {
            throw new Error('Cannot push onto finished qew');
        }

        if (Array.isArray(func)) {
            func.forEach(func => {
                this.addTask(func, onResolved, onRejected);
            });
        } else {
            this.addTask(func, onResolved, onRejected);
        }

        return this;
    }

    public done(afterNum: number = null, onlySuccess: boolean = false) {
        if (!this.isDone) {
            if (afterNum) {
                this.minDone = afterNum;
                this.minDoneSuccess = onlySuccess;
            } else {
                this.isDone = true;
                this.tasks = [];
                this.executing = [];

                this.onDone(this.numFulfilled, this.numRejected);
            }
        }

        return this;
    }


    private addTask(func: asyncFunc,
        onResolved?: onComplete,
        onRejected?: onComplete): void {

        const task: Task = {
            func,
            onResolved,
            onRejected,
            done: false,
        };

        this.tasks = [...this.tasks, task];

        this.tryMove();
    }

    private execute(task: Task) {
        const { func, onResolved, onRejected } = task;
        const fulfill = onResolved || this.onResolved;
        const reject = onRejected || this.onRejected;

        func()
            .then(result => {
                this.numFulfilled++;
                fulfill(result, this.numFulfilled, this.numRejected, this.done);
                this.doAfterEach(task);
            })
            .catch(error => {
                this.numRejected++;
                reject(error, this.numFulfilled, this.numRejected, this.done);
                this.doAfterEach(task);
            });
    }

    private doAfterEach(task: Task) {
        const delayMs = typeof this.delay === 'function' ? this.delay() : this.delay;
        setTimeout(() => {
            task.done = true;
            this.executing = this.executing.filter(task => !task.done); // clean up

            this.tryMove();
        }, delayMs);
    }

    private move() {
        const task = this.tasks[0]; // get task
        this.tasks = this.tasks.slice(1); // remove task from waiting list
        this.executing = [...this.executing, task]; // push task to executing
        this.execute(task);
    }

    private tryMove() {
        const isFree = this.executing.length < this.max;
        const hasWaiting = this.tasks.length > 0;
        let numDone = this.numFulfilled;
        if (this.minDoneSuccess) {
            numDone += this.numRejected;
        }
        const isDone = this.minDone && numDone >= this.minDone;

        if (isDone) {
            this.done();
        } else if (isFree && hasWaiting) {
            this.move();
        }
    }
}

const qew = new Qew();

export = Qew; 
