


type onComplete = (promResult: any, numFulfilled?: number, numRejected?: number) => void;
type asyncFunc = () => Promise<any>;

interface ObjectIdHolder {
    [x: number]: asyncFunc;
}


class Queue {
    private max: number;
    private onFulfilled: onComplete;
    private onRejected: onComplete;
    private numFulfilled: number;
    private numRejected: number;

    // private preExecute: asyncFunc[];


    constructor(
        concurrencyMax: number,
        onFulfilled: onComplete,
        onRejected: onComplete
    ) {
        this.max = concurrencyMax;
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
    }

    public push(func: asyncFunc): void {

    }

    private execute(func: asyncFunc) {
        func()
            .then(result => {
                this.onFulfilled(result);
                this.numFulfilled++;
            })
            .catch(error => {
                this.onRejected(error);
                this.numRejected++;
            });
    }
}


const queue = new Queue(2, console.log, console.error);
queue.push(() => count(1000));
queue.push(() => count(1000));
queue.push(() => count(1000));
queue.push(() => count(1000));
queue.push(() => count(1000));
queue.push(() => count(1000));




export = Queue;





// Main

let counter = 0;

function count(delay: number): Promise<number> {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve(counter);
            counter++;
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