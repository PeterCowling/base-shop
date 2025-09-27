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

it("handles empty cart items gracefully", async () => {
  const now = Date.now();
  const carts: AbandonedCart[] = [
    {
      email: "empty@example.com",
      cart: { items: [] },
      updatedAt: now - 25 * 60 * 60 * 1000,
    },
  ];

  await recoverAbandonedCarts(carts, now);

  expect(sendCampaignEmailMock).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "empty@example.com",
      subject: "You left items in your cart",
      html: "<p>You left items in your cart.</p>",
    }),
  );
});

