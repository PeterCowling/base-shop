import type { HookPayload } from "../src/hooks";

jest.mock("@acme/platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

const shop = "test-shop";
const payload: HookPayload = { campaign: "spring" };

describe.each([
  ["send", "onSend", "emitSend"],
  ["open", "onOpen", "emitOpen"],
  ["click", "onClick", "emitClick"],
])("%s hooks", (_label, onName, emitName) => {
  let on: (listener: any) => void;
  let emit: (shop: string, payload: HookPayload) => Promise<void>;

  beforeEach(async () => {
    jest.resetModules();
    const analytics = await import("@acme/platform-core/analytics");
    (analytics.trackEvent as jest.Mock).mockClear();
    const mod = await import("../src/hooks");
    on = mod[onName as keyof typeof mod] as typeof on;
    emit = mod[emitName as keyof typeof mod] as typeof emit;
  });

  it("runs all listeners in parallel and waits for completion", async () => {
    const order: string[] = [];
    const first = jest.fn(async () => {
      order.push("a-start");
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push("a-end");
    });
    const second = jest.fn(async () => {
      order.push("b-start");
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push("b-end");
    });

    on(first);
    on(second);
    const promise = emit(shop, payload);

    expect(order).toEqual(["a-start", "b-start"]);
    await promise;
    expect(order.slice(2).sort()).toEqual(["a-end", "b-end"].sort());
    expect(first).toHaveBeenCalledWith(shop, payload);
    expect(second).toHaveBeenCalledWith(shop, payload);
  });

  it("rejects when any listener throws", async () => {
    const error = new Error("fail");
    const failing = jest.fn(() => {
      throw error;
    });
    const succeeding = jest.fn();

    on(succeeding);
    on(failing);

    await expect(emit(shop, payload)).rejects.toThrow(error);
    expect(failing).toHaveBeenCalledWith(shop, payload);
    expect(succeeding).toHaveBeenCalledWith(shop, payload);
  });

  it("captures listeners registered after emits", async () => {
    const early = jest.fn();
    const late = jest.fn();
    on(early);
    await emit(shop, payload);
    on(late);
    await emit(shop, payload);
    expect(early).toHaveBeenCalledTimes(2);
    expect(late).toHaveBeenCalledTimes(1);
  });
});

describe("default analytics listeners", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it.each([
    ["emitSend", "email_sent"],
    ["emitOpen", "email_open"],
    ["emitClick", "email_click"],
  ])("tracks %s events", async (emitName, type) => {
    const { trackEvent } = await import("@acme/platform-core/analytics");
    (trackEvent as jest.Mock).mockClear();

    const { [emitName as string]: emit } = await import("../src/hooks");
    await emit(shop, payload);

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(shop, { type, campaign: payload.campaign });
  });
});
