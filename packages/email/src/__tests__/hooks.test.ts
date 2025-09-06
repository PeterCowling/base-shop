import type { HookPayload } from "../hooks";

jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

const shop = "test-shop";
const payload: HookPayload = { campaign: "spring" };

describe("custom hook listeners", () => {
  it.each([
    ["onSend", "emitSend"],
    ["onOpen", "emitOpen"],
    ["onClick", "emitClick"],
  ])("invokes %s listener", async (onName, emitName) => {
    jest.resetModules();
    const mod = await import("../hooks");
    const on = mod[onName as keyof typeof mod] as (fn: any) => void;
    const emit = mod[emitName as keyof typeof mod] as (
      shop: string,
      payload: HookPayload,
    ) => Promise<void>;

    const listener = jest.fn();
    on(listener);
    await emit(shop, payload);

    expect(listener).toHaveBeenCalledWith(shop, payload);
  });
});

describe("default analytics listeners", () => {
  it.each([
    ["emitSend", "email_sent"],
    ["emitOpen", "email_open"],
    ["emitClick", "email_click"],
  ])("forwards %s events", async (emitName, type) => {
    jest.resetModules();
    const { trackEvent } = await import("@platform-core/analytics");
    (trackEvent as jest.Mock).mockClear();

    const { [emitName as string]: emit } = await import("../hooks");
    await emit(shop, payload);

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(shop, { type, campaign: payload.campaign });
  });
});
