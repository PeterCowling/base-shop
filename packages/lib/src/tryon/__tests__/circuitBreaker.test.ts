import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { createBreaker } from "../providers/circuitBreaker";

jest.mock(
  "@acme/i18n/en.json",
  () => ({
    __esModule: true,
    default: {
      "tryon.circuitBreaker.timeout": "Timeout.",
      "tryon.circuitBreaker.open": "Circuit open.",
      "tryon.circuitBreaker.halfOpen": "Circuit half-open.",
    },
  }),
  { virtual: true },
);

describe("createBreaker", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("rejects slow operations with a timeout", async () => {
    jest.useFakeTimers();
    const breaker = createBreaker({ timeoutMs: 10, failureThreshold: 2, coolOffMs: 100 });

    const pending = breaker.exec("task", () => new Promise(() => {}));

    jest.advanceTimersByTime(10);

    await expect(pending).rejects.toThrow("Timeout.");
  });

  it("transitions between closed, open and half-open states", async () => {
    const breaker = createBreaker({ timeoutMs: 0, failureThreshold: 2, coolOffMs: 100 });

    let now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);

    const fail = async () => { throw new Error("boom"); };

    await expect(breaker.exec("svc", fail)).rejects.toThrow("boom");

    now = 10;
    await expect(breaker.exec("svc", fail)).rejects.toThrow("boom");

    now = 50;
    await expect(breaker.exec("svc", async () => "ignored")).rejects.toThrow("Circuit open.");

    now = 200;
    let release!: (value: string) => void;
    const first = breaker.exec(
      "svc",
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );

    await expect(breaker.exec("svc", async () => "second"))
      .rejects.toThrow("Circuit half-open.");

    release("ok");

    await expect(first).resolves.toBe("ok");

    now = 400;
    await expect(breaker.exec("svc", async () => "success")).resolves.toBe("success");
  });
});

