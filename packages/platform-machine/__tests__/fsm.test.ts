import { createFSM } from "./fsm";

describe("createFSM", () => {
  it("updates state on valid transitions", () => {
    const fsm = createFSM("idle", [
      { from: "idle", event: "FETCH", to: "loading" },
      { from: "loading", event: "RESOLVE", to: "success" },
      { from: "loading", event: "REJECT", to: "error" },
    ]);

    expect(fsm.state).toBe("idle");
    fsm.send("FETCH");
    expect(fsm.state).toBe("loading");
    fsm.send("RESOLVE");
    expect(fsm.state).toBe("success");
  });

  it("throws when no transition matches and no fallback is provided", () => {
    const fsm = createFSM("idle", [
      { from: "idle", event: "FETCH", to: "loading" },
    ]);

    expect(() => fsm.send("RESOLVE" as any)).toThrow(
      "No transition for state idle on event RESOLVE"
    );
  });

  it("invokes the fallback when no transition matches", () => {
    const fsm = createFSM("idle", [
      { from: "idle", event: "FETCH", to: "loading" },
    ]);

    const fallback = jest.fn(() => "error" as const);
    const result = fsm.send("RESOLVE" as any, fallback);
    expect(fallback).toHaveBeenCalledWith("idle", "RESOLVE");
    expect(result).toBe("error");
    expect(fsm.state).toBe("error");
  });
});
