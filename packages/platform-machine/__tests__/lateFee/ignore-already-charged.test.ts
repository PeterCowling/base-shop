import type { RentalOrder } from "@acme/types";

import { setupLateFeeTest } from "../helpers/lateFee";

describe("chargeLateFeesOnce", () => {
  it("ignores orders already charged", async () => {
    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        returnDueDate: "2024-01-01",
        lateFeeCharged: 25,
      },
    ];

    const mocks = await setupLateFeeTest({ orders });
    const { chargeLateFeesOnce } = await import("../../src/lateFeeService");

    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.stripeRetrieve).not.toHaveBeenCalled();
    expect(mocks.stripeCharge).not.toHaveBeenCalled();
    expect(mocks.markLateFeeCharged).not.toHaveBeenCalled();
  });
});
