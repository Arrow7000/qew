declare type onComplete = (promResult: any, numFulfilled?: number, numRejected?: number) => void;
declare type asyncFunc = () => Promise<any>;
declare type taskHolder = Task[];
declare interface Task {
    func: asyncFunc;
    onFulfilled: onComplete;
    onRejected: onComplete;
    done: boolean;
}

declare interface QewFactory {
    new (concurrencyMax: number,
        onFulfilled?: onComplete,
        onRejected?: onComplete): Qew;
}

// declare function Qew(concurrencyMax: number,
//     onFulfilled?: onComplete,
//     onRejected?: onComplete): Qew;


declare interface Qew {
    push: (func: asyncFunc | asyncFunc[],
        onFulfilled?: onComplete,
        onRejected?: onComplete) => void
}

declare var Qew: QewFactory;