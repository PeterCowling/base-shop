// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
import { createCampaign } from "../scheduler";

import {
  emitSend,
  sendCampaignEmail,
  setupTest,
  shop,
  teardown,
} from "./testUtils";

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));

describe("createCampaign – error handling", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("createCampaign propagates send errors", async () => {
    (sendCampaignEmail as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(
      createCampaign({
        shop,
        recipients: ['a@example.com'],
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('boom');
  });

  test('continues sending other recipients when some fail', async () => {
    (sendCampaignEmail as jest.Mock)
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'));
    await expect(
      createCampaign({
        shop,
        recipients: ['a@example.com', 'b@example.com'],
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('Failed to send some campaign emails');
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
  });

  test('createCampaign rejects when emitSend fails', async () => {
    (emitSend as jest.Mock).mockRejectedValueOnce(new Error('hook fail'));
    await expect(
      createCampaign({
        shop,
        recipients: ['a@example.com'],
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('hook fail');
    expect(ctx.memory[shop]).toBeUndefined();
  });
});
