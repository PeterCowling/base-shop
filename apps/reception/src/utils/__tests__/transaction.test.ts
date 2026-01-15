import { describe, expect, it } from "vitest";
import { runTransaction, type TransactionStep } from "../transaction";

describe("runTransaction", () => {
  it("executes all steps", async () => {
    const calls: string[] = [];
    const steps: TransactionStep[] = [
      { run: async () => { calls.push("a"); } },
      { run: async () => { calls.push("b"); } },
    ];
    await runTransaction(steps);
    expect(calls).toEqual(["a", "b"]);
  });

  it("rolls back previous steps on failure", async () => {
    const calls: string[] = [];
    const steps: TransactionStep[] = [
      {
        run: async () => { calls.push("run1"); },
        rollback: async () => { calls.push("rb1"); },
      },
      {
        run: async () => {
          calls.push("run2");
          throw new Error("fail");
        },
        rollback: async () => { calls.push("rb2"); },
      },
    ];
    await expect(runTransaction(steps)).rejects.toThrow("fail");
    expect(calls).toEqual(["run1", "run2", "rb1"]);
  });

  it("ignores rollback errors", async () => {
    const steps: TransactionStep[] = [
      {
        run: async () => {
          return undefined;
        },
        rollback: async () => {
          throw new Error("rb fail");
        },
      },
      {
        run: async () => {
          throw new Error("fail");
        },
      },
    ];
    await expect(runTransaction(steps)).rejects.toThrow("fail");
  });
});
