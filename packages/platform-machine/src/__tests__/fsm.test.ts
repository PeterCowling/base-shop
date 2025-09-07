import { createFSM, FSM } from "../fsm";

describe("createFSM", () => {
  it("handles valid transitions", () => {
    const machine = createFSM<
      "idle" | "loading" | "success",
      "FETCH" | "RESOLVE"
    >("idle", [
      { from: "idle", event: "FETCH", to: "loading" },
      { from: "loading", event: "RESOLVE", to: "success" },
    ]);

    expect(machine).toBeInstanceOf(FSM);
    expect(machine.state).toBe("idle");

    let nextState = machine.send("FETCH");
    expect(nextState).toBe("loading");
    expect(machine.state).toBe("loading");

    nextState = machine.send("RESOLVE");
    expect(nextState).toBe("success");
    expect(machine.state).toBe("success");
  });

  it("invokes fallback when no transition matches", () => {
    const fallback = jest.fn().mockReturnValue("fallback");
    const machine = createFSM<
      "idle" | "fallback",
      "UNKNOWN"
    >("idle", []);

    const nextState = machine.send("UNKNOWN", fallback);

    expect(fallback).toHaveBeenCalledWith("UNKNOWN", "idle");
    expect(nextState).toBe("fallback");
    expect(machine.state).toBe("fallback");
  });

  it("throws when no transition and no fallback provided", () => {
    const machine = createFSM<
      "idle" | "loading",
      "FETCH" | "UNKNOWN"
    >("idle", [{ from: "idle", event: "FETCH", to: "loading" }]);

    expect(() => machine.send("UNKNOWN")).toThrow(
      "No transition for event UNKNOWN from state idle",
    );
  });
});

