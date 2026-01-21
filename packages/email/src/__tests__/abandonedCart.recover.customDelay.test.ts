import type { AbandonedCart } from "../abandonedCart";
import { recoverAbandonedCarts } from "../abandonedCart";
import { sendCampaignEmail } from "../send";

jest.mock("../send", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
});

it("honors a custom delay", async () => {
  const delay = 6 * 60 * 60 * 1000; // 6 hours
  const now = Date.now();
  const carts: AbandonedCart[] = [
    {
      email: "old@example.com",
      cart: {},
      updatedAt: now - delay - 1000,
    },
    {
      email: "fresh@example.com",
      cart: {},
      updatedAt: now - delay + 1000,
    },
  ];

  await recoverAbandonedCarts(carts, now, delay);

  expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);
  expect(sendCampaignEmailMock).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "old@example.com",
      subject: "You left items in your cart",
      html: expect.stringContaining("You left items in your cart"),
    }),
  );
  expect(carts[0].reminded).toBe(true);
  expect(carts[1].reminded).toBeUndefined();
});

