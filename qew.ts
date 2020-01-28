type PromFunc<T> = () => Promise<T>;

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

  constructor(private maxConcurrent = 1, private delay = 0) {}

  public push<T>(promFunc: PromFunc<T>) {
    const [prom, resolveProm] = makeTriggerablePromise<T>();

    const funcToRun = () => {
      promFunc().then(result => {
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
