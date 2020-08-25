import { Qew } from "./qew";

jest.useFakeTimers();

const resolveAfter = <T>(ms: number, value?: T): Promise<T | void> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

// const mock = jest.fn(() => resolveAfter(1000, "hi"));
const mock = () => resolveAfter(1000, "hi");

// test("Single function gets called immediately", () => {
//   const qew = new Qew();

//   const prom = qew.push(mock);

//   //   expect(mock).not.toBeCalled();

//   //   jest.advanceTimersByTime(1000);

//   expect(mock).toBeCalled();
//   expect(mock).toHaveBeenCalledTimes(1);

//   //   await Promise.resolve();
// });

test("Two functions get called one after the other", () => {
  const qew = new Qew();

  const prom1 = qew.push(mock);
  const prom2 = qew.push(mock);

  expect(prom1).resolves.toEqual("dfsdf");
  expect(prom2).resolves.toEqual("dfsdf");

  //   expect(mock).toBeCalled();
  //   expect(mock).toHaveBeenCalledTimes(1);
  //   jest.advanceTimersByTime(1000);
  //   expect(mock).toHaveBeenCalledTimes(2);
});
