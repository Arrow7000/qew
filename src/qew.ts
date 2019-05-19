/// <reference path="basics.d.ts" />

// function isGroupTask<T>(
//   task: SingleTask<T> | GroupTask<T>
// ): task is GroupTask<T> {
//   return !!task.isGroupTask;
// }

// function isNotDone(slot: GroupResult<any> | null): boolean {
//   return !slot;
// }

// function makeSingleTask<T>(
//   func: AsyncFunc<T>,
//   callback: Callback<T>
// ): SingleTask<T> {
//   return {
//     func,
//     isGroupTask: false,
//     callback,
//     done: false
//   };
// }

// function makeGroupTask<T>(
//   func: AsyncFunc<T>,
//   groupCallback: GroupCallback<T>,
//   groupId: number,
//   index: number
// ): GroupTask<T> {
//   return {
//     func,
//     isGroupTask: true,
//     groupCallback,
//     done: false,
//     groupId,
//     index
//   };
// }

// function makeGroupCallback<T>(resolve: Resolve<T>): GroupCallback<T> {
//   return resultArray => resolve(resultArray);
// }

function makeTriggerablePromise<T>(): [Promise<T>, (inp: T) => void] {
  let triggerResolveWith!: (inp: T) => void;

  const promToReturn: Promise<T> = new Promise(resolve => {
    const funcThatResolvesProm = (inp: T) => resolve(inp);
    triggerResolveWith = funcThatResolvesProm;
  });

  return [promToReturn, triggerResolveWith];
}

export default class Qew<T> {
  /**
   * Set by user
   * Not intended to be mutable
   */
  private max: number;
  private delay: Delay;

  private tasks: (() => Promise<void>)[];
  private executing: ({ done: boolean; func: () => Promise<void> })[];
  private groupResultHolders: GroupResultsHolder<T>;

  /**
   * Internal state variables
   */
  private groupId: number;

  _setTimeout: SetTimeout;

  constructor(maxConcurrent: number = 1, delay: Delay = 0) {
    if (maxConcurrent < 1) {
      throw new Error("Max concurrent functions needs to be at least 1");
    }
    this.max = maxConcurrent;
    this.delay = delay;

    this.tasks = [];
    this.executing = [];
    this.groupResultHolders = {};
    this.groupId = 0;

    this._setTimeout = setTimeout;
  }

  //   public pushProm<T>(funcs: AsyncFunc<T>[]): Promise<GroupResult<T>[]>;
  //   public pushProm<T>(func: AsyncFunc<T>): Promise<T>;
  //   public pushProm<T>(
  //     funcOrFuncs: AsyncFunc<T> | AsyncFunc<T>[]
  //   ): Promise<GroupResult<T>[] | T> {
  //     if (Array.isArray(funcOrFuncs)) {
  //       const funcs = funcOrFuncs;

  //       if (funcs.length < 1) {
  //         // is empty array
  //         return Promise.resolve([]);
  //       }

  //       let groupCallback: GroupCallback<T>;
  //       const promToReturn: Promise<GroupResult<T>[]> = new Promise(resolve => {
  //         groupCallback = makeGroupCallback(resolve);
  //       });
  //       const tasks: GroupTask<T>[] = funcs.map((func, i) => {
  //         return makeGroupTask(func, groupCallback, this.groupId, i);
  //       });

  //       this.groupResultHolders[this.groupId] = new Array(tasks.length).fill(
  //         null
  //       );

  //       this.groupId++;
  //       this.tasks = [...this.tasks, tasks];

  //       this.tryMove();

  //       return promToReturn;
  //     } else {
  //       const func = funcOrFuncs;

  //       let callback: Callback<T>;
  //       const promToReturn: Promise<T> = new Promise((resolve, reject) => {
  //         callback = makeCallback(resolve, reject);
  //       });

  //       const task: SingleTask<T> = makeSingleTask(func, callback);

  //       this.tasks = [...this.tasks, task];

  //       this.tryMove();

  //       return promToReturn;
  //     }
  //   }
  public async pushProm<T>(func: AsyncFunc<T>) {
    const [prom, trigger] = makeTriggerablePromise<T>();

    async function triggerPromResolve() {
      const result = await func();
      trigger(result);
    }

    this.tasks.push(triggerPromResolve);

    console.log("trymove from pushprom");
    this.tryMove();

    return prom;
  }

  private tryMove() {
    const isFree = this.executing.length < this.max;
    const hasWaiting = this.tasks.length > 0;
    console.log(`is trymove, isFree: ${isFree}, hasWaiting: ${hasWaiting}`);
    if (isFree && hasWaiting) {
      console.log("moveAndExecuting");
      this.moveAndExecute();
    }
  }

  private async moveAndExecute() {
    const nextTask = this.tasks[0];

    // if (Array.isArray(nextUp)) {
    //   const group = nextUp;
    //   const groupDoneAfterThis = group.length < 2;
    //   const task = group[0];
    //   if (task) {
    //     if (groupDoneAfterThis) {
    //       this.tasks = this.tasks.slice(1);
    //     } else {
    //       const restGroupTasks = group.slice(1);
    //       const otherTasks = this.tasks.slice(1);
    //       this.tasks = [restGroupTasks, ...otherTasks];
    //     }

    //     this.executing = [...this.executing, task]; // push task to executing
    //     this.execute(task);
    //   } else {
    //     // handle group being empty
    //   }
    // } else {
    this.tasks = this.tasks.slice(1); // remove task from waiting list
    const executingTask = { func: nextTask, done: false };
    this.executing = [...this.executing, executingTask]; // push task to executing
    // this.execute(executingTask);
    // }

    console.log("about to execute task", nextTask);
    nextTask().then(() => {
      console.log("task complete");
      // this.doAfterEach(executingTask);

      const delayMs =
        typeof this.delay === "function" ? this.delay() : this.delay;

      executingTask.done = true;
      this.executing = this.executing.filter(task => !task.done); // clean up

      console.log("doing after each task, delayMs:", delayMs);
      console.log("this.executing:", this.executing);

      console.log("trymove from move");
      this.tryMove();
    });
  }

  //   private async execute(task: { done: boolean; func: () => Promise<void> }) {
  //     const { func } = task;

  // if (isGroupTask(task)) {
  //   const { groupId, index } = task;

  //   func()
  //     .then(result => {
  //       this.groupResultHolders[groupId][index] = {
  //         error: null,
  //         result
  //       };

  //       this.doAfterEachGroupTask(task);
  //       this.doAfterEach(task);
  //     })
  //     .catch(error => {
  //       this.groupResultHolders[groupId][index] = {
  //         error,
  //         result: null
  //       };

  //       this.doAfterEachGroupTask(task);
  //       this.doAfterEach(task);
  //     });
  // } else {
  //   const { callback } = task;

  //   func()
  //     .then(result => {
  //       callback(null, result);
  //       this.doAfterEach(task);
  //     })
  //     .catch(error => {
  //       callback(error);
  //       this.doAfterEach(task);
  //     });
  // }

  //     func();
  //     this.doAfterEach(task);
  //   }

  private doAfterEach(task: { done: boolean; func: () => Promise<void> }) {
    const delayMs =
      typeof this.delay === "function" ? this.delay() : this.delay;
    task.done = true;
    this.executing = this.executing.filter(task => !task.done); // clean up

    console.log("doing after each task, delayMs:", delayMs);
    console.log("this.executing:", this.executing);

    // this._setTimeout(() => {
    // console.log("trymove from doaftereach");
    // this.tryMove();
    // }, delayMs);
  }

  //   private doAfterEachGroupTask(task: GroupTask<T>) {
  //     const { groupId, groupCallback } = task;
  //     const groupResults = this.groupResultHolders[groupId];
  //     const allDone = !groupResults.some(isNotDone);
  //     if (allDone) {
  //       groupCallback(groupResults);
  //       delete this.groupResultHolders[groupId];
  //     }
  //   }
}
