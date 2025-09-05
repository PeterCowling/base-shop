import { beforeEach, describe, expect, jest, test } from "@jest/globals";

let trackEvent: jest.Mock;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.doMock("@platform-core/analytics", () => ({
    __esModule: true,
    trackEvent: jest.fn(),
  }));
  trackEvent = require("@platform-core/analytics").trackEvent as jest.Mock;
});

describe("hooks", () => {
  const shop = "test-shop";
  const payload = { campaign: "spring" } as const;

  test("emitSend invokes all handlers in parallel and awaits completion", async () => {
    const { onSend, emitSend } = await import("../hooks");
    const order: string[] = [];
    let resolve1: () => void;
    let resolve2: () => void;
    const handler1 = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolve1 = () => {
            order.push("h1");
            res();
          };
        })
    );
    const handler2 = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolve2 = () => {
            order.push("h2");
            res();
          };
        })
    );
    onSend(handler1);
    onSend(handler2);
    const promise = emitSend(shop, payload);
    expect(handler1).toHaveBeenCalledWith(shop, payload);
    expect(handler2).toHaveBeenCalledWith(shop, payload);
    let finished = false;
    promise.then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    resolve2!();
    resolve1!();
    await promise;
    expect(order).toEqual(["h2", "h1"]);
  });

  test("emitOpen invokes all handlers in parallel and awaits completion", async () => {
    const { onOpen, emitOpen } = await import("../hooks");
    const order: string[] = [];
    let resolve1: () => void;
    let resolve2: () => void;
    const handler1 = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolve1 = () => {
            order.push("h1");
            res();
          };
        })
    );
    const handler2 = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolve2 = () => {
            order.push("h2");
            res();
          };
        })
    );
    onOpen(handler1);
    onOpen(handler2);
    const promise = emitOpen(shop, payload);
    expect(handler1).toHaveBeenCalledWith(shop, payload);
    expect(handler2).toHaveBeenCalledWith(shop, payload);
    let finished = false;
    promise.then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    resolve2!();
    resolve1!();
    await promise;
    expect(order).toEqual(["h2", "h1"]);
  });

  test("emitClick invokes all handlers in parallel and awaits completion", async () => {
    const { onClick, emitClick } = await import("../hooks");
    const order: string[] = [];
    let resolve1: () => void;
    let resolve2: () => void;
    const handler1 = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolve1 = () => {
            order.push("h1");
            res();
          };
        })
    );
    const handler2 = jest.fn(
      () =>
        new Promise<void>((res) => {
          resolve2 = () => {
            order.push("h2");
            res();
          };
        })
    );
    onClick(handler1);
    onClick(handler2);
    const promise = emitClick(shop, payload);
    expect(handler1).toHaveBeenCalledWith(shop, payload);
    expect(handler2).toHaveBeenCalledWith(shop, payload);
    let finished = false;
    promise.then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    resolve2!();
    resolve1!();
    await promise;
    expect(order).toEqual(["h2", "h1"]);
  });

  test("default listeners emit analytics events", async () => {
    const { emitSend, emitOpen, emitClick } = await import("../hooks");
    await emitSend(shop, payload);
    await emitOpen(shop, payload);
    await emitClick(shop, payload);
    expect(trackEvent).toHaveBeenNthCalledWith(1, shop, {
      type: "email_sent",
      campaign: payload.campaign,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, shop, {
      type: "email_open",
      campaign: payload.campaign,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(3, shop, {
      type: "email_click",
      campaign: payload.campaign,
    });
  });
});
