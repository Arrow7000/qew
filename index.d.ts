/// <reference path="./src/basics.d.ts" />

declare class Qew {
    constructor(maxConcurrent: number = 1, delay: delay = 0);

    public push(funcs: asyncFunc[], cb: groupCallback): this;
    public push(func: asyncFunc, cb: callback): this;

    public pushProm<T>(funcs: asyncFunc[]): Promise<(GroupResult<T>)[]>;
    public pushProm<T>(func: asyncFunc): Promise<T>;
}