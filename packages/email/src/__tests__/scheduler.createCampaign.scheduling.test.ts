// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));

import {
  setupTest,
  teardown,
  shop,
  sendCampaignEmail,
  emitSend,
} from "./testUtils";
import { createCampaign, sendDueCampaigns, setClock } from "../scheduler";

describe("createCampaign – scheduling, batching, and timing", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("createCampaign honors batch size and delay", async () => {
    process.env.EMAIL_BATCH_SIZE = "1";
    process.env.EMAIL_BATCH_DELAY_MS = "50";
    const promise = createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(49);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await promise;
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
  });

  test("createCampaign does not schedule delay when batch delay is zero", async () => {
    process.env.EMAIL_BATCH_SIZE = "1";
    process.env.EMAIL_BATCH_DELAY_MS = "0";
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    const promise = createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    await jest.runAllTimersAsync();
    await promise;
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  test("createCampaign handles past and future sendAt", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const idPast = await createCampaign({
      shop,
      recipients: ["past@example.com"],
      subject: "Past",
      body: "<p>Past</p>",
      sendAt: past,
    });
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    const sentPast = ctx.memory[shop].find((c) => c.id === idPast)!;
    expect(sentPast.sentAt).toBe(new Date().toISOString());

    const futureDate = new Date(Date.now() + 60000);
    const future = futureDate.toISOString();
    await createCampaign({
      shop,
      recipients: ["future@example.com"],
      subject: "Future",
      body: "<p>Future</p>",
      sendAt: future,
    });
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    jest.setSystemTime(futureDate);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
  });

  test("deliverCampaign sets sentAt from injected clock", async () => {
    const fake = new Date("2020-02-02T00:00:00Z");
    setClock({ now: () => fake });
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    const campaign = ctx.memory[shop][0];
    expect(campaign.sentAt).toBe(fake.toISOString());
  });

  test(
    "deliverCampaign batches recipients and adds unsubscribe links",
    async () => {
      process.env.EMAIL_BATCH_SIZE = "2";
      process.env.EMAIL_BATCH_DELAY_MS = "10";
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const recipients = ["a@example.com", "b@example.com", "c@example.com"];
      const promise = createCampaign({
        shop,
        recipients,
        subject: "Hello",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
      });
      await jest.runAllTimersAsync();
      await promise;
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10);
      expect(sendCampaignEmail).toHaveBeenCalledTimes(recipients.length);
      expect(emitSend).toHaveBeenCalledTimes(recipients.length);
      recipients.forEach((r, i) => {
        const html = (sendCampaignEmail as jest.Mock).mock.calls[i][0]
          .html as string;
        expect(html).toContain("Unsubscribe");
        expect(html).toContain(encodeURIComponent(r));
      });
      setTimeoutSpy.mockRestore();
    },
    10000,
  );
});

