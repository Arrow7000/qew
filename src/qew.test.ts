import Qew from "./qew";

interface fakeCallback {
  runAfterMs: number;
  cb: voidFunc;
}

function getFakeTimer(): [
  (ms: number) => void,
  (cb: voidFunc, ms: number) => void
] {
  const timer = { msElapsed: 0 };
  const queueContainer: { queue: fakeCallback[] } = { queue: [] };

  const makeNewCallback = (cb: voidFunc, ms: number) => ({
    runAfterMs: ms,
    cb
  });

  function fakeSetTimeout(func: voidFunc, ms: number) {
    const newCb = makeNewCallback(func, timer.msElapsed + ms);
    queueContainer.queue.push(newCb);
    if (ms < 1) {
      progressTimer(ms);
    }
  }

  function progressTimer(ms: number) {
    timer.msElapsed += ms;

    const toRunNow = queueContainer.queue.filter(
      ({ runAfterMs }) => runAfterMs <= timer.msElapsed
    );

    toRunNow.forEach(({ cb }) => cb());

    const newQueue = queueContainer.queue.filter(
      ({ runAfterMs }) => runAfterMs > timer.msElapsed
    );

    queueContainer.queue = newQueue;
  }

  return [progressTimer, fakeSetTimeout];
}

function resolveAfter(
  ms: number,
  cb: voidFunc,
  fakeSetTimeout: (cb: voidFunc, ms: number) => void
): Promise<void> {
  return new Promise(resolve =>
    fakeSetTimeout(() => {
      cb();
      resolve();
    }, ms)
  );
}

describe("Fake timer", () => {
  let progressTimer: (ms: number) => void, fakeSetTimeout: SetTimeout;

  beforeEach(() => {
    const [pT, fST] = getFakeTimer();
    progressTimer = pT;
    fakeSetTimeout = fST;
  });

  it("should not resolve promise before time has elapsed", () => {
    let resolved = false;
    resolveAfter(2, () => (resolved = true), fakeSetTimeout);
    progressTimer(1);

    expect(resolved).toBe(false);
  });

  it("should resolve promise after time has elapsed", () => {
    let resolved = false;
    resolveAfter(2, () => (resolved = true), fakeSetTimeout);
    progressTimer(2);

    expect(resolved).toBe(true);
  });

  it("in multiple steps", () => {
    let resolved = false;
    resolveAfter(2, () => (resolved = true), fakeSetTimeout);

    progressTimer(1);
    expect(resolved).toBe(false);

    progressTimer(1);
    expect(resolved).toBe(true);
  });
});

describe("Qew", () => {
  let qew: Qew<any>;
  let progressTimer: (ms: number) => void, fakeSetTimeout: SetTimeout;

  //   beforeEach(() => {
  //     const [pT, fST] = getFakeTimer();
  //     progressTimer = pT;
  //     fakeSetTimeout = fST;
  //   });

  describe("Single threaded, no delay", () => {
    beforeEach(() => {
      const [pT, fST] = getFakeTimer();
      progressTimer = pT;
      fakeSetTimeout = fST;

      qew = new Qew(1);
      qew._setTimeout = fakeSetTimeout;
    });

    it("should resolve 3 one after another", () => {
      const resolvedArray = [false, false, false];

      qew.pushProm(() =>
        resolveAfter(
          1,
          () => {
            resolvedArray[0] = true;
            console.log("func 0 run");
          },
          fakeSetTimeout
        )
      );

      qew.pushProm(() =>
        resolveAfter(
          2,
          () => {
            resolvedArray[1] = true;
            console.log("func 1 run");
          },
          fakeSetTimeout
        )
      );
      qew.pushProm(() =>
        resolveAfter(
          3,
          () => {
            resolvedArray[2] = true;
            console.log("func 2 run");
          },
          fakeSetTimeout
        )
      );

      progressTimer(1);

      expect(resolvedArray[0]).toBeTruthy();
      expect(resolvedArray[1]).toBeFalsy();
      expect(resolvedArray[2]).toBeFalsy();

      progressTimer(1);

      expect(resolvedArray[0]).toBeTruthy();
      expect(resolvedArray[1]).toBeTruthy();
      expect(resolvedArray[2]).toBeFalsy();

      progressTimer(1);

      expect(resolvedArray[0]).toBeTruthy();
      expect(resolvedArray[1]).toBeTruthy();
      expect(resolvedArray[2]).toBeTruthy();
    });
  });
});
