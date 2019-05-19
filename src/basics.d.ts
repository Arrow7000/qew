// type Callback<T> = (err: Error, result?: T) => void;
// type GroupCallback<T> = (resultArray: GroupResult<T>[]) => void;
type AsyncFunc<T> = () => Promise<T>;
type getNumber = () => number;
type Delay = number | getNumber;
type voidFunc = () => void;

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

type SetTimeout = (callback: () => void, ms: number) => void;

// type Resolve<T> = (result: T) => void;
// type Reject = (error: Error) => void;

// /**
//  * Tasks
//  */
// interface TaskBasic<T> {
//   func: AsyncFunc<T>;
//   done: boolean;
//   isGroupTask: boolean;
// }

// interface SingleTask<T> extends TaskBasic<T> {
//   callback: Callback<T>;
// }

// interface GroupTask<T> extends TaskBasic<T> {
//   groupCallback: GroupCallback<T>;
//   groupId: number;
//   index: number;
// }

// type taskHolder<T> = (SingleTask<T> | GroupTask<T>[])[];
