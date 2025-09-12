import {
  setupTest,
  teardown,
  shop,
  sendCampaignEmail,
  emitSend,
  resolveSegment,
  validateShopName,
  listEvents,
  renderTemplate,
} from "./testUtils";
import { createCampaign, sendDueCampaigns, setClock } from "../scheduler";

describe("createCampaign", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("trackedBody rewrites links and appends tracking pixel", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.test";
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: '<a href="https://example.com/a">A</a><a href="/b">B</a>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html;
    expect(html).toContain('url=https%3A%2F%2Fexample.com%2Fa');
    expect(html).toContain('url=%2Fb');
    expect(html).toContain(
      '/api/marketing/email/open?shop=test-shop&campaign='
    );
    expect(
      (html.match(/<a href="https:\/\/base.test\/api\/marketing\/email\/click/g) || [])
        .length,
    ).toBe(2);
  });

  test("deliverCampaign inserts tracking pixel and unsubscribe link", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hello",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toMatch(/open\?shop=test-shop&campaign=.*&t=\d+/);
    expect(html).toContain("Unsubscribe");
    expect(html).toContain(encodeURIComponent("a@example.com"));
    const match = html.match(/href="([^"]+)">Unsubscribe<\/a>/);
    expect(match?.[1]).toMatch(/^\/api\/marketing\/email\/unsubscribe/);
    expect(emitSend).toHaveBeenCalledWith(shop, { campaign: expect.any(String) });
  });

  test("trackedBody rewrites anchor href for click tracking", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Link",
      body: '<p><a href="https://example.com/page?x=1&y=2">Link</a> %%UNSUBSCRIBE%%</p>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain(
      "/api/marketing/email/click?shop=test-shop&campaign=",
    );
    expect(html).toContain(
      "url=https%3A%2F%2Fexample.com%2Fpage%3Fx%3D1%26y%3D2",
    );
    expect(html).not.toContain('href="https://example.com/page?x=1&y=2"');
  });

  test("trackedBody includes base URL and tracking wrappers", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example";
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: '<p><a href="https://dest1">One</a><a href="https://dest2">Two</a> %%UNSUBSCRIBE%%</p>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0]
      .html as string;
    expect(html).toMatch(
      /<img src="https:\/\/base\.example\/api\/marketing\/email\/open\?shop=test-shop&campaign=[^&]+&t=\d+" alt="" style="display:none" width="1" height="1"\/>/,
    );
    expect(html).toContain(
      'href="https://base.example/api/marketing/email/click?shop=test-shop',
    );
    expect(html).toContain('url=https%3A%2F%2Fdest1');
    expect(html).toContain('url=https%3A%2F%2Fdest2');
    expect(html).not.toContain('href="https://dest1"');
    expect(html).not.toContain('href="https://dest2"');
  });

  test("deliverCampaign validates shop name", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(validateShopName).toHaveBeenCalledTimes(2);
    expect(validateShopName).toHaveBeenNthCalledWith(1, shop);
    expect(validateShopName).toHaveBeenNthCalledWith(2, shop);
  });

  test("createCampaign filters unsubscribed recipients using analytics events", async () => {
    (listEvents as jest.Mock).mockResolvedValueOnce([
      { type: "email_unsubscribe", email: "b@example.com" },
    ]);
    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(listEvents).toHaveBeenCalledWith(shop);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmail).toHaveBeenCalledWith({
      to: "a@example.com",
      subject: "Hi",
      html: expect.any(String),
    });
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

  test("createCampaign writes campaign to store", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    expect(ctx.readCampaigns).toHaveBeenCalledWith(shop);
    expect(ctx.writeCampaigns).toHaveBeenCalledWith(shop, ctx.memory[shop]);
  });

  test("createCampaign resolves recipients from segment without explicit recipients", async () => {
    (resolveSegment as jest.Mock).mockResolvedValue(["seg@example.com"]);
    const id = await createCampaign({
      shop,
      segment: "test",
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    expect(resolveSegment).toHaveBeenCalledWith(shop, "test");
    expect(sendCampaignEmail).toHaveBeenCalledWith({
      to: "seg@example.com",
      subject: "Hi",
      html: expect.any(String),
    });
    expect(typeof id).toBe("string");
    const campaign = ctx.memory[shop].find((c) => c.id === id)!;
    expect(campaign.recipients).toEqual(["seg@example.com"]);
  });

  test("createCampaign propagates segment resolution errors", async () => {
    (resolveSegment as jest.Mock).mockRejectedValueOnce(new Error("segfail"));
    await expect(
      createCampaign({
        shop,
        segment: "bad",
        subject: "Hi",
        body: "<p>Hi</p>",
      }),
    ).rejects.toThrow("segfail");
  });

  test("deliverCampaign resolves segment once and updates recipients", async () => {
    (resolveSegment as jest.Mock).mockResolvedValue([
      "s1@example.com",
      "s2@example.com",
    ]);
    await createCampaign({
      shop,
      recipients: ["initial@example.com"],
      segment: "vip",
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(resolveSegment).toHaveBeenCalledTimes(1);
    expect(resolveSegment).toHaveBeenCalledWith(shop, "vip");
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    const sentTo = (sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to);
    expect(sentTo).toEqual(["s1@example.com", "s2@example.com"]);
    const campaign = ctx.memory[shop][0];
    expect(campaign.recipients).toEqual(["s1@example.com", "s2@example.com"]);
  });

  test("createCampaign throws when required fields are missing", async () => {
    await expect(
      createCampaign({
        shop,
        recipients: ["a@example.com"],
        body: "<p>Hi</p>",
      } as any),
    ).rejects.toThrow("Missing fields");
    await expect(
      createCampaign({
        shop,
        recipients: ["a@example.com"],
        subject: "Hi",
      } as any),
    ).rejects.toThrow("Missing fields");
    await expect(
      createCampaign({
        shop,
        subject: "Hi",
        body: "<p>Hi</p>",
        recipients: [],
      }),
    ).rejects.toThrow("Missing fields");
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

  test('createCampaign rejects when segment yields no recipients', async () => {
    (resolveSegment as jest.Mock).mockResolvedValue([]);
    await expect(
      createCampaign({
        shop,
        segment: 'seg',
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('Missing fields');
  });

  test("deliverCampaign renders template HTML for every recipient", async () => {
    (renderTemplate as jest.Mock).mockReturnValue("<p>Rendered</p>");
    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hello",
      body: "<p>Ignored</p>",
      templateId: "welcome",
    });
    expect(renderTemplate).toHaveBeenCalledTimes(1);
    expect(renderTemplate).toHaveBeenCalledWith("welcome", {
      subject: "Hello",
      body: "<p>Ignored</p>",
    });
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    (sendCampaignEmail as jest.Mock).mock.calls.forEach((c) => {
      expect((c[0].html as string)).toContain("Rendered");
    });
  });

  test("deliverCampaign appends unsubscribe link when placeholder missing", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hello",
      body: "<p>Hello world</p>",
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain("<p><a href=");
    expect(html).toContain("Unsubscribe</a></p>");
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
