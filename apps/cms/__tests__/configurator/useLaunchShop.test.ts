import { renderHook, act } from "@testing-library/react";
import { useLaunchShop } from "../../src/app/cms/configurator/hooks/useLaunchShop";
import { getRequiredSteps } from "../../src/app/cms/configurator/steps";

describe("useLaunchShop", () => {
  const state = {
    shopId: "shop",
    completed: Object.fromEntries(
      getRequiredSteps().map((s) => [s.id, "complete"])
    ),
  } as any;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("updates status on successful launch", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode('data:{"step":"create","status":"success"}\n\n'),
      encoder.encode('data:{"step":"init","status":"success"}\n\n'),
      encoder.encode('data:{"step":"deploy","status":"success"}\n\n'),
    ];
    const mockReader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({ value: chunks[0], done: false })
        .mockResolvedValueOnce({ value: chunks[1], done: false })
        .mockResolvedValueOnce({ value: chunks[2], done: false })
        .mockResolvedValueOnce({ value: undefined, done: true }),
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      body: { getReader: () => mockReader },
    });

    const { result } = renderHook(() => useLaunchShop(state));

    await act(async () => {
      await result.current.launchShop();
    });

    expect(result.current.launchStatus).toEqual({
      create: "success",
      init: "success",
      deploy: "success",
    });
    expect(result.current.launchError).toBeNull();
  });

  it("sets error state on network failure", async () => {
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
  });
});

