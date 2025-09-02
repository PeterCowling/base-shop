import { renderHook, act } from "@testing-library/react";
import { useFSM } from "../useFSM";

describe("useFSM", () => {
  it("handles transitions and fallback", () => {
    const { result } = renderHook(() =>
      useFSM<
        "idle" | "loading" | "success" | "fallback",
        "FETCH" | "RESOLVE" | "UNKNOWN"
      >("idle", [
        { from: "idle", event: "FETCH", to: "loading" },
        { from: "loading", event: "RESOLVE", to: "success" },
      ])
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.state).toBe("idle");

    let nextState: string;
    act(() => {
      nextState = result.current!.send("FETCH");
    });
    expect(nextState).toBe("loading");
    expect(result.current?.state).toBe(nextState);

    act(() => {
      nextState = result.current!.send("RESOLVE");
    });
    expect(nextState).toBe("success");
    expect(result.current?.state).toBe(nextState);

    act(() => {
      nextState = result.current!.send("UNKNOWN", () => "fallback");
    });
    expect(nextState).toBe("fallback");
    expect(result.current?.state).toBe(nextState);
  });
});
