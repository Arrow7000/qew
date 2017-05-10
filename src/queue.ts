type onComplete = (promResult: any, numFulfilled: number, numRejected: number, done: () => void) => void;
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


class Queue {
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

    /**
     * Internal state variables
     */
    private numFulfilled: number;
    private numRejected: number;

    constructor(maxConcurrent: number = 1, delay: delay = 0, onResolved: onComplete = null, onRejected: onComplete = null) {
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
        this.done = this.done.bind(this);
    }

    public push(func: asyncFunc | asyncFunc[], onResolved?: onComplete, onRejected?: onComplete): void {
        if (this.isDone) {
            throw new Error('Cannot push onto finished queue');
        }

        if (func.length) {
            (<asyncFunc[]>func).forEach(func => {
                this.addTask(func, onResolved, onRejected);
            });
        } else {
            this.addTask((<asyncFunc>func), onResolved, onRejected);
        }
    }

    public done() {
        this.isDone = true;
        this.tasks = [];
        this.executing = [];
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
            this.executing = this.executing.filter(task => !task.done);

            this.tryMove();
        }, delayMs);
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


// const queue = new Queue(2, 0, {
//     onResolved: (result, numDone, numFailed, done) => {
//         console.log(result);
//         console.log(numDone, numFailed);
//         if (numDone + numFailed >= 10) {
//             console.log('All dunged out!!');
//             done();
//         }
//     },
//     onRejected: (result) => console.error(result)
// });

// for (let i = 0; i < 20; i++) {
//     queue.push(() => ding(2000));
// }




// function ding(delay) {
//     return new Promise((resolve, reject) => {
//         setTimeout(function () {
//             if (Math.random() < .95) {
//                 resolve('ding!');
//             } else {
//                 reject('dong...')
//             }
//         }, delay);
//     });
// }


export = Queue; 
