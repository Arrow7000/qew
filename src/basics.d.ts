type callback = <T>(err: Error, result?: T) => void;
type groupCallback = <T>(resultArray: GroupResult<T>[]) => void;
type asyncFunc = <T>() => Promise<T>;
type getNumber = () => number;
type delay = number | getNumber;

interface GroupSuccessResult<T> {
    result: T;
}

interface GroupFailResult {
    error: Error;
}

type GroupResult<T> = GroupSuccessResult<T> | GroupFailResult;

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
