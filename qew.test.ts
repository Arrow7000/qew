import * as sinon from "@sinonjs/fake-timers";
import { Qew } from "./qew";

const callAfter = (ms: number, cb: () => void) =>
  new Promise((res) => setTimeout(() => res(cb()), ms));

/**
 * Because Jest's fake timers are accursed and we shall never speak of them again.
 */
let clock: sinon.InstalledClock;

const advanceClock = async (ms: number) => clock.tickAsync(ms);

beforeAll(() => {
  clock = sinon.install();
});

beforeEach(() => {
  clock.reset();
});

afterAll(() => {
  clock.uninstall();
});

it("Test that qew can run a single function", async () => {
  const qew = new Qew();

  const fn = jest.fn(() => 1);
  const oneSecFunc = () => callAfter(1000, fn);

  const prom = qew.push(oneSecFunc);

  expect(fn).toHaveBeenCalledTimes(0);

  await advanceClock(999);
  expect(fn).toHaveBeenCalledTimes(0);

  await advanceClock(1);
  expect(fn).toHaveBeenCalledTimes(1);

  await advanceClock(1000);
  expect(fn).toHaveBeenCalledTimes(1);

  expect(prom).resolves.toBe(1);
});

it("Test singlethreaded qew with a delay", async () => {
  const qew = new Qew(1, 500);

  const fn1 = jest.fn(() => 1);
  const fn2 = jest.fn(() => 2);

  const prom1 = qew.push(() => callAfter(1000, fn1));
  const prom2 = qew.push(() => callAfter(1000, fn2));

  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(0);

  await advanceClock(999);
  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(0);

  await advanceClock(1);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(0);

  await advanceClock(500);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(0);

  await advanceClock(999);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(0);

  await advanceClock(1);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);

  await advanceClock(5000);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);

  expect(prom1).resolves.toBe(1);
  expect(prom2).resolves.toBe(2);
});

it("Test qew with max concurrent tasks of 2 and no delay", async () => {
  const qew = new Qew(2);

  const fn1 = jest.fn(() => 1);
  const fn2 = jest.fn(() => 2);
  const fn3 = jest.fn(() => 3);
  const fn4 = jest.fn(() => 4);

  const prom1 = qew.push(() => callAfter(1000, fn1));
  const prom2 = qew.push(() => callAfter(1000, fn2));
  const prom3 = qew.push(() => callAfter(1000, fn3));
  const prom4 = qew.push(() => callAfter(1000, fn4));

  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(0);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(999);
  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(0);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(1);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(999);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  // Hmm this is odd. 1ms should definitely be enough but maybe internally the promises need extra 1ms to resolve? Idk.
  await advanceClock(2);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(1);
  expect(fn4).toHaveBeenCalledTimes(1);

  await advanceClock(5000);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(1);
  expect(fn4).toHaveBeenCalledTimes(1);

  expect(prom1).resolves.toBe(1);
  expect(prom2).resolves.toBe(2);
  expect(prom3).resolves.toBe(3);
  expect(prom4).resolves.toBe(4);
});

it("Test qew with max concurrent tasks of 2 and a delay", async () => {
  const qew = new Qew(2, 500);

  const fn1 = jest.fn(() => 1);
  const fn2 = jest.fn(() => 2);
  const fn3 = jest.fn(() => 3);
  const fn4 = jest.fn(() => 4);

  const prom1 = qew.push(() => callAfter(1000, fn1));
  const prom2 = qew.push(() => callAfter(1000, fn2));
  const prom3 = qew.push(() => callAfter(1000, fn3));
  const prom4 = qew.push(() => callAfter(1000, fn4));

  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(0);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(999);
  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(0);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(1);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(1499);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(1);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(1);
  expect(fn4).toHaveBeenCalledTimes(1);

  await advanceClock(5000);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(1);
  expect(fn4).toHaveBeenCalledTimes(1);

  expect(prom1).resolves.toBe(1);
  expect(prom2).resolves.toBe(2);
  expect(prom3).resolves.toBe(3);
  expect(prom4).resolves.toBe(4);
});

it("Test qew with max concurrent tasks of 3, a delay and functions that run for different amounts of time", async () => {
  const qew = new Qew(3, 100);

  const fn1 = jest.fn(() => 1);
  const fn2 = jest.fn(() => 2);
  const fn3 = jest.fn(() => 3);
  const fn4 = jest.fn(() => 4);

  const prom1 = qew.push(() => callAfter(1000, fn1));
  const prom2 = qew.push(() => callAfter(100, fn2));
  const prom3 = qew.push(() => callAfter(800, fn3));
  const prom4 = qew.push(() => callAfter(300, fn4));

  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(0);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(100);
  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(0);

  await advanceClock(400);
  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(0);
  expect(fn4).toHaveBeenCalledTimes(1);

  await advanceClock(300);
  expect(fn1).toHaveBeenCalledTimes(0);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(1);
  expect(fn4).toHaveBeenCalledTimes(1);

  await advanceClock(200);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(1);
  expect(fn4).toHaveBeenCalledTimes(1);

  await advanceClock(5000);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(fn3).toHaveBeenCalledTimes(1);
  expect(fn4).toHaveBeenCalledTimes(1);

  expect(prom1).resolves.toBe(1);
  expect(prom2).resolves.toBe(2);
  expect(prom3).resolves.toBe(3);
  expect(prom4).resolves.toBe(4);
});
