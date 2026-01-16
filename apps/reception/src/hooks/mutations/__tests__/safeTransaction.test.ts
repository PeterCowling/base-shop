import { describe, expect, it, vi } from "vitest";

import {
  bankDeposit,
  bankWithdrawal,
  deposit,
  exchange,
  withdraw,
} from "../safeTransaction";

describe("safeTransaction helpers", () => {
  it("calls addSafeCount with correct params", async () => {
    const add = vi.fn();
    await deposit(add, 10, { "5": 2 }, 1, 0);
    expect(add).toHaveBeenCalledWith("deposit", 10, { "5": 2 }, 1, 0);
    await withdraw(add, 5);
    expect(add).toHaveBeenCalledWith("withdrawal", 5, undefined);
    await bankDeposit(add, 20, undefined, 2, 1);
    expect(add).toHaveBeenCalledWith(
      "bankDeposit",
      20,
      undefined,
      2,
      1
    );
    await bankWithdrawal(add, 7);
    expect(add).toHaveBeenCalledWith("bankWithdrawal", 7, undefined);
    await exchange(add, { a: 1 }, { b: 2 }, 3, "drawerToSafe");
    expect(add).toHaveBeenCalledWith(
      "exchange",
      3,
      { incoming: { b: 2 }, outgoing: { a: 1 } },
      undefined,
      undefined,
      "drawerToSafe"
    );
  });
});
