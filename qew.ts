type AsyncFunc<T> = () => Promise<T>;

function makeTriggerablePromise<T>(): [Promise<T>, (inp: T) => void] {
  let triggerResolveWith!: (inp: T) => void;
  const promToReturn: Promise<T> = new Promise(resolve => {
    const funcThatResolvesProm = (inp: T) => resolve(inp);
    triggerResolveWith = funcThatResolvesProm;
  });
  return [promToReturn, triggerResolveWith];
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
  constructor(private maxConcurrent = 1, private delay = 0) {}

  /**
   * Push another async function onto the queue
   * @param asyncFunc the async function to push onto this queue
   */
  public push<T>(asyncFunc: AsyncFunc<T>) {
    const [prom, resolveProm] = makeTriggerablePromise<T>();

    const funcToRun = () => {
      asyncFunc().then(result => {
        resolveProm(result);
        this.executing = this.executing - 1;

        setTimeout(() => {
          this.tryMove();
        }, this.delay);
      });
    };

    this.queue = [...this.queue, funcToRun];

    this.tryMove();

    return prom;
  }

  /**
   * @deprecated this is now only an alias for `Qew#push`
   */
  public pushProm = this.push;

  private tryMove() {
    if (this.executing >= this.maxConcurrent) {
      // do nothing
      return;
    } else {
      const first = this.queue.shift();

      if (first) {
        this.executing = this.executing + 1;
        first();
      }
    }
  }
}

export default Qew;
