import type { RentalOrder } from "@acme/types";

import { setupLateFeeTest } from "../helpers/lateFee";

describe("chargeLateFeesOnce", () => {
  it("does not charge orders within the grace period", async () => {
    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        returnDueDate: "2024-01-09",
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
