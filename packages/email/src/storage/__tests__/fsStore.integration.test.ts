import { promises as fs } from "node:fs";
import path from "node:path";

import { DATA_ROOT } from "@acme/platform-core/dataRoot";

import type { AbandonedCart } from "../../abandonedCart";
import { recoverAbandonedCarts } from "../../abandonedCart";
import { sendCampaignEmail } from "../../send";
import { fsCampaignStore } from "../fsStore";
import type { Campaign } from "../types";

jest.mock("../../send", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@acme/lib", () => ({
  __esModule: true,
  validateShopName: (s: string) => s,
}));

const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;

describe("fsCampaignStore integration", () => {
  const shop = "integration-shop";
  const shopDir = path.join(DATA_ROOT, shop);

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(shopDir, { recursive: true, force: true });
  });

  it("stores, retrieves, and sends abandoned cart emails", async () => {
    const carts: AbandonedCart[] = [
      { email: "user@example.com", cart: {}, updatedAt: 0 },
    ];

    await recoverAbandonedCarts(carts, 0, 0);
    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);

    const opts = sendCampaignEmailMock.mock.calls[0][0];
    const campaign: Campaign = {
      id: "c1",
      recipients: [opts.to],
      subject: opts.subject,
      body: opts.html!,
      sendAt: new Date().toISOString(),
    };

    await fsCampaignStore.writeCampaigns(shop, [campaign]);
    const file = path.join(shopDir, "campaigns.json");
    const fileJson = JSON.parse(await fs.readFile(file, "utf8"));
    expect(fileJson).toEqual([campaign]);

    const saved = await fsCampaignStore.readCampaigns(shop);
    expect(saved).toEqual([campaign]);

    await sendCampaignEmail({
      to: saved[0].recipients[0],
      subject: saved[0].subject,
      html: saved[0].body,
    });

    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(2);
    expect(sendCampaignEmailMock).toHaveBeenNthCalledWith(2, {
      to: campaign.recipients[0],
      subject: campaign.subject,
      html: campaign.body,
    });
  });
});
