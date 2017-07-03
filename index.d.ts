export namespace qew {
    interface GroupSuccessResult<T> {
        result: T;
    }
    interface GroupFailResult {
        error: Error;
    }
    type GroupResult<T> = GroupSuccessResult<T> | GroupFailResult;
}

type callback = <T>(err: Error, result?: T) => void;
type groupCallback = <T>(resultArray: qew.GroupResult<T>[]) => void;
type asyncFunc = <T>() => Promise<T>;
type getNumber = () => number;
type delay = number | getNumber;


declare class Qew {
    constructor(maxConcurrent?: number, delay?: delay);

    public push(func: asyncFunc, cb: callback): this;
    public push(funcs: asyncFunc[], cb: groupCallback): this;

    public pushProm<T>(func: () => Promise<T>): Promise<T>;
    public pushProm<T>(funcs: (() => Promise<T>)[]): Promise<qew.GroupResult<T>[]>;
}

export default Qew;

export function isResolved<T>(result: qew.GroupResult<T>): result is qew.GroupSuccessResult<T>;