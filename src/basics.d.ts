type promSuccessResult = any;
type promResult = promSuccessResult | Error;
type callback = (err: Error, result?: promSuccessResult) => void;
type groupCallback = (resultArray: GroupResult[]) => void;
type asyncFunc = () => Promise<any>;
type getNumber = () => number;
type delay = number | getNumber;
interface GroupResult {
    result: promSuccessResult;
    error: Error;
}

interface GroupResultsHolder {
    [groupId: number]: GroupResult[];
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
