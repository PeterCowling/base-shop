import { createFSM } from "../fsm";

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

  it("ignores events with no matching transition", () => {
    const fsm = createFSM("idle", [
      { from: "idle", event: "FETCH", to: "loading" },
    ]);

    fsm.send("RESOLVE" as any);
    expect(fsm.state).toBe("idle");
  });
});
