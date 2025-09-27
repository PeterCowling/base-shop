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

it("sends emails for carts older than a day and marks them as reminded", async () => {
  const now = Date.now();
  const carts: AbandonedCart[] = [
    {
      email: "old@example.com",
      cart: {},
      updatedAt: now - 25 * 60 * 60 * 1000,
    },
    {
      email: "fresh@example.com",
      cart: {},
      updatedAt: now - 2 * 60 * 60 * 1000,
    },
    {
      email: "already@example.com",
      cart: {},
      updatedAt: now - 26 * 60 * 60 * 1000,
      reminded: true,
    },
  ];

  await recoverAbandonedCarts(carts, now);

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
  expect(carts[2].reminded).toBe(true);
});

