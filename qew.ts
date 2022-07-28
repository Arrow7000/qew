/**
 * This returns a promise along with two functions to remotely ~detonate~ trigger either a resolution of rejection of the promise from elsewhere in the code. It's magic!
 */
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

export type Options = { debug?: boolean };

export class Qew {
  private queue: (() => void)[] = [];
  private executing = 0;
  private debug = false;

  /**
   *
   * @param maxConcurrent how many functions can be run simultaneously
   * @param delay how many ms to wait between when one function has resolved and
   * the next one is run
   * @param options the only option currently supported is `debug`, which if enabled prints debugging logs
   */
  constructor(
    private maxConcurrent = 1,
    private delay: number | (() => number) = 0,
    options?: Options
  ) {
    if (maxConcurrent < 1) {
      throw new Error("maxConcurrent has to be 1 or higher");
    }
    if (typeof delay === "number" && delay < 0) {
      throw new Error(
        "`delay` parameter should be either a non-negative number or a function that returns one"
      );
    }

    this.debug = options?.debug ?? this.debug;

    this.debugLog(
      `Debugging for Qew enabled! This qew has a maxConcurrent of ${maxConcurrent} and a ${
        typeof delay === "number"
          ? `delay of ${delay}ms`
          : "custom delay generator function"
      }`
    );

    this.tryMove = this.tryMove.bind(this);
    this.push = this.push.bind(this);
    this.pushProm = this.pushProm.bind(this);
    this.debugLog = this.debugLog.bind(this);
  }

  private debugLog = (...args: Parameters<typeof console.log>) =>
    this.debug ? console.log(...args) : undefined;

  /**
   * Push another async function onto the queue
   * @param asyncFunc the async function to push onto this queue
   * @returns a Promise that resolves with `asyncFunc`'s resolved value –
   * whenever `asyncFunc` has been run and resolved. Or the Promise will reject
   * if `asyncFunc`'s Promise rejects
   */
  public push<T>(asyncFunc: () => Promise<T>) {
    const [prom, resolveProm, rejectProm] = makeTriggerablePromise<T>();

    const funcToRun = () => {
      asyncFunc()
        .then((result) => {
          resolveProm(result);
          this.executing = this.executing - 1;

          const delay =
            typeof this.delay === "function" ? this.delay() : this.delay;

          this.debugLog(
            `Function resolved! About to tryMove again after ${delay}ms. (At ${new Date()})`
          );

          setTimeout(() => this.tryMove("promise completion"), delay);
        })
        .catch(rejectProm);
    };

    this.queue.push(funcToRun);

    this.tryMove("push");

    return prom;
  }

  /**
   * @deprecated this is now only an alias for `Qew#push`
   */
  public pushProm = this.push;

  private tryMove(triggeredBy: "push" | "promise completion") {
    this.debugLog(
      `Trying to move because of: ${triggeredBy} (at unix time ${new Date()})`
    );

    if (this.executing < this.maxConcurrent) {
      const first = this.queue.shift();
      this.debugLog(
        `Under execution limit! ${
          first ? "Grabbed a function off the queue" : "Nothing on the queue"
        }`
      );

      if (first) {
        this.executing = this.executing + 1;
        first();
      }
    } else {
      this.debugLog(
        `Currently at execution limit of ${this.maxConcurrent} so stopped move attempt`
      );
    }
  }
}

export default Qew;
