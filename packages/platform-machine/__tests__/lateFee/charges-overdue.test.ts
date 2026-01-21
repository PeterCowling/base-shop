import type { RentalOrder } from "@acme/types";

import { setupLateFeeTest } from "../helpers/lateFee";

describe("chargeLateFeesOnce", () => {
  it("charges overdue orders and marks them", async () => {
    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        returnDueDate: "2024-01-01",
      },
      {
        id: "2",
        sessionId: "sess2",
        shop: "test",
        returnDueDate: "2024-01-05",
        returnReceivedAt: "2024-01-06",
      },
      {
        id: "3",
        sessionId: "sess3",
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

    expect(mocks.stripeRetrieve).toHaveBeenCalledTimes(1);
    expect(mocks.stripeCharge).toHaveBeenCalledTimes(1);
    expect(mocks.markLateFeeCharged).toHaveBeenCalledWith("test", "sess1", 25);
  });
});
