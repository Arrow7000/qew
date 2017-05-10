declare type onComplete = (promResult: any, numFulfilled?: number, numRejected?: number) => void;
declare type asyncFunc = () => Promise<any>;
declare type taskHolder = Task[];
declare interface Task {
    func: asyncFunc;
    onFulfilled: onComplete;
    onRejected: onComplete;
    done: boolean;
}

declare interface QueueFactory {
    new (concurrencyMax: number,
        onFulfilled?: onComplete,
        onRejected?: onComplete): Queue;
}

// declare function Queue(concurrencyMax: number,
//     onFulfilled?: onComplete,
//     onRejected?: onComplete): Queue;


declare interface Queue {
    push: (func: asyncFunc | asyncFunc[],
        onFulfilled?: onComplete,
        onRejected?: onComplete) => void
}

declare var Queue: QueueFactory;