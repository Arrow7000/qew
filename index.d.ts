type callback = <T>(err: Error, result?: T) => void;
type groupCallback = <T>(resultArray: GroupResult<T>[]) => void;
type asyncFunc = <T>() => Promise<T>;
type getNumber = () => number;
type delay = number | getNumber;
interface GroupResult<T> {
    result: T;
    error: Error;
}

declare class Qew {
    constructor(maxConcurrent: number, delay: delay);

    public push(func: asyncFunc, cb: callback): this;
    public push(funcs: asyncFunc[], cb: groupCallback): this;

    public pushProm<T>(func: asyncFunc): Promise<T>;
    public pushProm<T>(funcs: asyncFunc[]): Promise<(GroupResult<T>)[]>;
}

export = Qew;