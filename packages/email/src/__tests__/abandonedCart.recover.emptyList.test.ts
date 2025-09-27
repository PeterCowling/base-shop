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

it("handles an empty cart list without sending emails", async () => {
  await recoverAbandonedCarts([], Date.now());
  expect(sendCampaignEmailMock).not.toHaveBeenCalled();
});

