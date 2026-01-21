import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { type SessionSubset,setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return refund", () => {
  test("refunds remaining deposit after computing damage", async () => {
    const session: SessionSubset = {
      metadata: { depositTotal: "50" },
      payment_intent: "pi_1",
    } as SessionSubset;
    const { computeDamageFee, refundCreate } = setupReturnMocks({ session });
    computeDamageFee.mockResolvedValue(20);

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess", damage: "scratch" }),
    } as unknown as NextRequest);

    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 50, [], true);
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 30 * 100,
    });
    expect(await res.json()).toEqual({ ok: true });
  });
});
