type onComplete = (promResult: any, numFulfilled?: number, numRejected?: number) => void;
type asyncFunc = () => Promise<any>;
type taskHolder = task[];

interface task {
    func: asyncFunc;
    onFulfilled: onComplete;
    onRejected: onComplete;
    done: boolean;
    id: number;
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
    private idCounter: number;
    private numFulfilled: number;
    private numRejected: number;

    constructor(
        concurrencyMax: number,
        onFulfilled?: onComplete,
        onRejected?: onComplete
    ) {
        this.idCounter = 0;
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

        this.idCounter++;

        const task: task = {
            func,
            onFulfilled,
            onRejected,
            done: false,
            id: this.idCounter
        };

        this.tasks = [...this.tasks, task];

        this.tryMove();
    }

    private execute(task: task) {
        const { func, onFulfilled, onRejected } = task;
        const fulfill = onFulfilled || this.onFulfilled;
        const reject = onRejected || this.onRejected;

        func()
            .then(result => {
                fulfill(result);
                this.numFulfilled++;
                this.doAfterEach(task);
            })
            .catch(error => {
                reject(error);
                this.numRejected++;
                this.doAfterEach(task);
            });
    }

    private doAfterEach(task: task) {
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


const queue = new Queue(2, console.log, console.error);

for (let i = 0; i < 10; i++) {
    queue.push(() => count(i, Math.random() * 2500));
}


// queue.push(() => count(1000));
// queue.push(() => count(1000));
// queue.push(() => count(1000));
// queue.push(() => count(1000));
// queue.push(() => count(1000));
// queue.push(() => count(1000));




export = Queue;





// Main

let counter = 0;

function count(number: number, delay: number): Promise<number> {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve(number);
            // counter++;
        }, delay);
    });
}







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