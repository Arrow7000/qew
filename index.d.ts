//// <reference types="./src/basics.d.ts" />


type callback = <T>(err: Error, result?: T) => void;
type groupCallback = <T>(resultArray: GroupResult<T>[]) => void;
type asyncFunc = <T>() => Promise<T>;
type getNumber = () => number;
type delay = number | getNumber;
interface GroupResult<T> {
    result: T;
    error: Error;
}

interface GroupResultsHolder<T> {
    [groupId: number]: (GroupResult<T>)[];
}

type resolve<T> = (result: T) => void;
type reject = (error: Error) => void;


/**
 * Tasks
 */
interface TaskBasic {
    func: asyncFunc;
    done: boolean;
    isGroupTask: boolean;
}

interface SingleTask extends TaskBasic {
    callback: callback;
}

interface GroupTask extends TaskBasic {
    groupCallback: groupCallback;
    groupId: number;
    index: number;
}

type taskHolder = (SingleTask | GroupTask[])[];


declare class Qew {
    constructor(maxConcurrent: number = 1, delay: delay = 0);

    public push(funcs: asyncFunc[], cb: groupCallback): this;
    public push(func: asyncFunc, cb: callback): this;

    public pushProm<T>(funcs: asyncFunc[]): Promise<(GroupResult<T>)[]>;
    public pushProm<T>(func: asyncFunc): Promise<T>;
}