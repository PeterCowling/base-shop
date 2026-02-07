import { act,renderHook } from "@testing-library/react";

import { useLaunchShop } from "../../src/app/cms/configurator/hooks/useLaunchShop";
import { getRequiredSteps } from "../../src/app/cms/configurator/steps";

jest.mock("../../src/app/cms/configurator/steps", () => ({
  getRequiredSteps: () => [
    { id: "create", label: "Create" },
    { id: "init", label: "Init" },
    { id: "deploy", label: "Deploy" },
  ],
}));

const encoder = new TextEncoder();

function streamFromEvents(events: Array<Record<string, unknown>>): any {
  const chunks = events.map((evt) =>
    encoder.encode(`data:${JSON.stringify(evt)}\n\n`),
  );
  return {
    getReader() {
      return {
        read: async () => {
          const value = chunks.shift();
          return value
            ? { value, done: false }
            : { value: undefined, done: true };
        },
      };
    },
  };
}

function completeState(): any {
  return {
    shopId: "shop",
    completed: Object.fromEntries(
      getRequiredSteps().map((s) => [s.id, "complete"]),
    ),
  } as any;
}

describe("useLaunchShop", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("returns early when shopId missing", async () => {
    const { result } = renderHook(() => useLaunchShop({} as any));
    await act(async () => {
      await result.current.launchShop();
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.launchStatus).toBeNull();
  });

  it("calls onIncomplete and skips fetch when required steps missing", async () => {
    const onIncomplete = jest.fn();
    const state = { shopId: "shop", completed: {} } as any;
    const { result } = renderHook(() =>
      useLaunchShop(state, { onIncomplete }),
    );
    await act(async () => {
      await result.current.launchShop();
    });
    expect(onIncomplete).toHaveBeenCalled();
    const missing = onIncomplete.mock.calls[0][0];
    expect(Array.isArray(missing)).toBe(true);
    expect(missing.length).toBe(getRequiredSteps().length);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.launchStatus).toBeNull();
  });

  it("launches without seeding when categoriesText missing", async () => {
    const state = completeState();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: streamFromEvents([
        { step: "create", status: "success" },
        { step: "init", status: "success" },
        { step: "deploy", status: "success" },
      ]),
    });

    const { result } = renderHook(() => useLaunchShop(state));
    await act(async () => {
      await result.current.launchShop();
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.seed).toBe(false);
    expect(result.current.launchStatus).toEqual({
      create: "success",
      init: "success",
      deploy: "success",
    });
  });

  it("launches with seeding when categoriesText present", async () => {
    const state = { ...completeState(), categoriesText: "seed" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: streamFromEvents([
        { step: "create", status: "success" },
        { step: "init", status: "success" },
        { step: "seed", status: "success" },
        { step: "deploy", status: "success" },
      ]),
    });

    const { result } = renderHook(() => useLaunchShop(state));
    await act(async () => {
      await result.current.launchShop();
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.seed).toBe(true);
    expect(result.current.launchStatus).toEqual({
      create: "success",
      init: "success",
      seed: "success",
      deploy: "success",
    });
  });

  it("records failure events from stream", async () => {
    const state = completeState();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: streamFromEvents([
        { step: "create", status: "success" },
        { step: "init", status: "failure", error: "boom" },
      ]),
    });

    const { result } = renderHook(() => useLaunchShop(state));
    await act(async () => {
      await result.current.launchShop();
    });

    expect(result.current.launchError).toBe("boom");
    expect(result.current.failedStep).toBe("init");
    expect(result.current.launchStatus).toEqual({
      create: "success",
      init: "failure",
      deploy: "pending",
    });
  });

  it("handles fetch rejection with generic error", async () => {
    const state = completeState();
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useLaunchShop(state));
    await act(async () => {
      await result.current.launchShop();
    });

    expect(result.current.launchStatus).toEqual({
      create: "pending",
      init: "pending",
      deploy: "pending",
    });
    expect(result.current.launchError).toBe("Launch failed");
    expect(result.current.failedStep).toBeNull();
  });
});

