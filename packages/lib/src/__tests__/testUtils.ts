import { jest } from "@jest/globals";

export function withIsolatedModules<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    jest.isolateModules(() => {
      fn().then(resolve).catch(reject);
    });
  });
}
