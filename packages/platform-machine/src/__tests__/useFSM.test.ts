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

    let next: string;
    act(() => {
      next = result.current!.send("FETCH");
    });
    expect(next).toBe("loading");
    expect(result.current?.state).toBe(next);

    act(() => {
      next = result.current!.send("RESOLVE");
    });
    expect(next).toBe("success");
    expect(result.current?.state).toBe(next);

    act(() => {
      next = result.current!.send("UNKNOWN", () => "fallback");
    });
    expect(next).toBe("fallback");
    expect(result.current?.state).toBe(next);
  });
});
