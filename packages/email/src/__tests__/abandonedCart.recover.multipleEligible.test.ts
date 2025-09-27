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

it("sends emails for multiple eligible carts", async () => {
  const delay = 24 * 60 * 60 * 1000; // 1 day
  const now = Date.now();
  const carts: AbandonedCart[] = [
    {
      email: "first@example.com",
      cart: {},
      updatedAt: now - delay - 1000,
    },
    {
      email: "second@example.com",
      cart: {},
      updatedAt: now - delay - 2000,
    },
    {
      email: "fresh@example.com",
      cart: {},
      updatedAt: now - delay + 1000,
    },
  ];

  await recoverAbandonedCarts(carts, now, delay);

  expect(sendCampaignEmailMock).toHaveBeenCalledTimes(2);
  expect(sendCampaignEmailMock).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      to: "first@example.com",
      subject: "You left items in your cart",
      html: expect.stringContaining("You left items in your cart"),
    }),
  );
  expect(sendCampaignEmailMock).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      to: "second@example.com",
      subject: "You left items in your cart",
      html: expect.stringContaining("You left items in your cart"),
    }),
  );
  expect(carts[0].reminded).toBe(true);
  expect(carts[1].reminded).toBe(true);
  expect(carts[2].reminded).toBeUndefined();
});

