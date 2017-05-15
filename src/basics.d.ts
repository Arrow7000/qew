// type promSuccessResult = any;
// type promResult = any | Error;
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

type resolve = (result: any) => void;
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

// interface PromGroupTask extends TaskBasic {
//     promResolve: resolve;
//     promReject: reject;
//     groupId: number;
//     index: number;
// }


type taskHolder = Array<SingleTask | GroupTask[]>;
