import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    paymentIntents: { create: jest.fn() },
  },
}));

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  readOrders: jest.fn(),
  markLateFeeCharged: jest.fn(),
}));

jest.mock("@platform-core/utils", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

import { chargeLateFeesOnce } from "../lateFeeService";
import { readOrders, markLateFeeCharged } from "@platform-core/repositories/rentalOrders.server";
import { stripe } from "@acme/stripe";
import { DAY_MS } from "@date-utils";

describe("chargeLateFeesOnce", () => {
  const shop = "s1";
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "late-fee-"));
    await fs.mkdir(path.join(root, shop), { recursive: true });
    await fs.writeFile(
      path.join(root, shop, "shop.json"),
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 1, feeAmount: 5 } }),
    );

    jest.spyOn(Date, "now").mockReturnValue(10 * DAY_MS);

    (readOrders as jest.Mock).mockReset();
    (markLateFeeCharged as jest.Mock).mockReset();
    (stripe.checkout.sessions.retrieve as jest.Mock).mockReset();
    (stripe.paymentIntents.create as jest.Mock).mockReset();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("charges orders past the grace period", async () => {
    (readOrders as jest.Mock).mockResolvedValue([
      { sessionId: "sess1", returnDueDate: new Date(8 * DAY_MS).toISOString() },
    ]);
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      customer: "cus_1",
      currency: "usd",
      payment_intent: { payment_method: "pm_1" },
    });

    await chargeLateFeesOnce(shop, root);

    expect(stripe.paymentIntents.create).toHaveBeenCalled();
    expect(markLateFeeCharged).toHaveBeenCalledWith(shop, "sess1", 5);
  });

  it("skips orders within the grace period", async () => {
    (readOrders as jest.Mock).mockResolvedValue([
      { sessionId: "sess1", returnDueDate: new Date(9 * DAY_MS).toISOString() },
    ]);

    await chargeLateFeesOnce(shop, root);

    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    expect(markLateFeeCharged).not.toHaveBeenCalled();
  });
});
