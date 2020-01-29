type AsyncFunc<T> = () => Promise<T>;
type DelayOrDelayer = number | (() => number);

function makeTriggerablePromise<T>(): [
  Promise<T>,
  (inp: T) => void,
  (error: any) => void
] {
  let triggerResolveWith!: (inp: T) => void;
  let triggerRejectWith!: (error: any) => void;
  const promToReturn: Promise<T> = new Promise((resolve, reject) => {
    const funcThatResolvesProm = (inp: T) => resolve(inp);
    triggerResolveWith = funcThatResolvesProm;
    triggerRejectWith = reject;
  });
  return [promToReturn, triggerResolveWith, triggerRejectWith];
}

export class Qew {
  private queue: (() => void)[] = [];
  private executing = 0;

  /**
   *
   * @param maxConcurrent how many functions can be run simultaneously
   * @param delay how many ms to wait between when one function has resolved and
   * the next one is run
   */
  constructor(
    private maxConcurrent = 1,
    private delay: number | (() => number) = 0
  ) {
    if (maxConcurrent < 1) {
      throw new Error("maxConcurrent has to be 1 or higher");
    }
    if (typeof delay === "number" && delay < 0) {
      throw new Error("delay should be a positive number");
    }
  }

  /**
   * Push another async function onto the queue
   * @param asyncFunc the async function to push onto this queue
   */
  public push = <T>(asyncFunc: AsyncFunc<T>) => {
    const [prom, resolveProm, rejectProm] = makeTriggerablePromise<T>();

    const funcToRun = () => {
      asyncFunc()
        .then(result => {
          resolveProm(result);
          this.executing = this.executing - 1;

          const delay =
            typeof this.delay === "function" ? this.delay() : this.delay;

          setTimeout(() => {
            this.tryMove();
          }, delay);
        })
        .catch(rejectProm);
    };

    this.queue.push(funcToRun);

    this.tryMove();

    return prom;
  };

  /**
   * @deprecated this is now only an alias for `Qew#push`
   */
  public pushProm = this.push;

  private tryMove = () => {
    if (this.executing < this.maxConcurrent) {
      const first = this.queue.shift();

      if (first) {
        this.executing = this.executing + 1;
        first();
      }
    }
  };
}

export default Qew;
