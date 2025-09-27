import { recoverAbandonedCarts } from "../abandonedCart";
import type { AbandonedCart } from "../abandonedCart";
import { sendCampaignEmail } from "../send";

jest.mock("../send", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
});

it("returns failed carts when the email provider errors and leaves cart untouched", async () => {
  const now = Date.now();
  const carts: AbandonedCart[] = [
    { email: "fail@example.com", cart: {}, updatedAt: now - 25 * 60 * 60 * 1000 },
  ];

  sendCampaignEmailMock.mockRejectedValueOnce(new Error("boom"));

  const failed = await recoverAbandonedCarts(carts, now);
  expect(failed).toEqual([carts[0]]);
  expect(carts[0].reminded).toBeUndefined();
});

