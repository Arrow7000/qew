/// <reference path="basics.d.ts" />



declare module "qew" {
    function push(funcs: asyncFunc[], cb: groupCallback): this;
    function push(func: asyncFunc, cb: callback): this;
    function push(funcOrFuncs: asyncFunc | asyncFunc[], callback: callback | groupCallback);

    function pushProm<T>(funcs: asyncFunc[]): Promise<(GroupResult<T>)[]>;
    function pushProm<T>(func: asyncFunc): Promise<T>;
    function pushProm<T>(funcOrFuncs: asyncFunc | asyncFunc[]): Promise<(GroupResult<T>)[] | T>;

    export = push;
}