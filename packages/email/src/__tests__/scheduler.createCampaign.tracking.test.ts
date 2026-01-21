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
import { createCampaign } from "../scheduler";

describe("createCampaign – tracking and content", () => {
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
});

