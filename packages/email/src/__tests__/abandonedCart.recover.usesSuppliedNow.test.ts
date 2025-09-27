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

it("uses supplied now value", async () => {
  const delay = 60 * 60 * 1000; // 1 hour
  const customNow = 10_000;
  const carts: AbandonedCart[] = [
    {
      email: "old@example.com",
      cart: {},
      updatedAt: customNow - delay - 1,
    },
    {
      email: "fresh@example.com",
      cart: {},
      updatedAt: customNow - delay + 1,
    },
  ];

  await recoverAbandonedCarts(carts, customNow, delay);

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

