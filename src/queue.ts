type onComplete = (promResult: any, numFulfilled?: number, numRejected?: number) => void;
type asyncFunc = () => Promise<any>;
type taskHolder = Task[];
interface Task {
    func: asyncFunc;
    onFulfilled: onComplete;
    onRejected: onComplete;
    done: boolean;
}



class Queue {
    /**
     * Set by user
     * Not intended to be mutable
     */
    private max: number;
    private delay: number;
    private onFulfilled: onComplete;
    private onRejected: onComplete;
    private tasks: taskHolder;
    private executing: taskHolder;

    /**
     * Internal state variables
     */
    private numFulfilled: number;
    private numRejected: number;

    constructor(
        concurrencyMax: number,
        onFulfilled?: onComplete,
        onRejected?: onComplete
    ) {
        this.tasks = [];
        this.executing = [];

        this.max = concurrencyMax;
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
    }

    public push(func: asyncFunc | asyncFunc[],
        onFulfilled?: onComplete,
        onRejected?: onComplete): void {

        if (func.length) {
            (<asyncFunc[]>func).forEach(func => {
                this.addTask(func, onFulfilled, onRejected);
            });
        } else {
            this.addTask((<asyncFunc>func), onFulfilled, onRejected);
        }
    }

    private addTask(func: asyncFunc,
        onFulfilled?: onComplete,
        onRejected?: onComplete): void {

        const task: Task = {
            func,
            onFulfilled,
            onRejected,
            done: false,
        };

        this.tasks = [...this.tasks, task];

        this.tryMove();
    }

    private execute(task: Task) {
        const { func, onFulfilled, onRejected } = task;
        const fulfill = onFulfilled || this.onFulfilled;
        const reject = onRejected || this.onRejected;

        func()
            .then(result => {
                this.numFulfilled++;
                fulfill(result, this.numFulfilled, this.numRejected);
                this.doAfterEach(task);
            })
            .catch(error => {
                this.numRejected++;
                reject(error, this.numFulfilled, this.numRejected);
                this.doAfterEach(task);
            });
    }

    private doAfterEach(task: Task) {
        task.done = true;
        this.executing = this.executing.filter(task => !task.done);

        this.tryMove();
    }

    private move() {
        if (this.executing.length >= this.max) {
            throw new Error(`Cannot add more than ${this.max} tasks to execute simultaneously`);
        }
        if (this.tasks.length < 1) {
            throw new Error(`No more tasks to load`);
        }
        const len = this.tasks.length - 1; // get index of last task
        const task = this.tasks[len]; // get last task
        this.tasks = this.tasks.slice(0, len); // remove task from tasks list
        this.executing = [...this.executing, task]; // add task to executing list
        this.execute(task);
    }

    private tryMove() {
        if (this.executing.length < this.max && this.tasks.length > 0) {
            this.move();
        }
    }
}

export = Queue;
