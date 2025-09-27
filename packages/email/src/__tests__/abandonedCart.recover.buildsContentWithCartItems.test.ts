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

it("builds email content with cart items", async () => {
  const now = Date.now();
  const carts: AbandonedCart[] = [
    {
      email: "cart@example.com",
      cart: { items: [{ name: "Widget" }, { name: "Gadget" }] },
      updatedAt: now - 25 * 60 * 60 * 1000,
    },
  ];

  await recoverAbandonedCarts(carts, now);

  expect(sendCampaignEmailMock).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "cart@example.com",
      subject: "You left items in your cart",
      html: expect.stringContaining("<li>Widget</li>"),
    }),
  );
  expect(sendCampaignEmailMock.mock.calls[0][0].html).toContain("<li>Gadget</li>");
});

