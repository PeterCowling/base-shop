import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { type SessionSubset,setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return partial refund", () => {
  test("deducts damage and refunds remainder", async () => {
    const session: SessionSubset = {
      metadata: { depositTotal: "80" },
      payment_intent: "pi_1",
    } as SessionSubset;
    const { computeDamageFee, refundCreate, markReturned } = setupReturnMocks({ session });
    computeDamageFee.mockResolvedValue(30);

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess", damage: "scuff" }),
    } as unknown as NextRequest);

    expect(computeDamageFee).toHaveBeenCalledWith("scuff", 80, [], true);
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 50 * 100,
    });
    expect(markReturned.mock.calls[1][2]).toBe(30);
    expect(await res.json()).toEqual({ ok: true });
  });
});
