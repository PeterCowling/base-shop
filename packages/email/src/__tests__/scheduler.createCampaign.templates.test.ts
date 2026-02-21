// Mocks must be hoisted before scheduler imports @acme/lib and analytics.server
jest.mock("@acme/i18n/useTranslations.server", () => ({
  __esModule: true,
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));
jest.mock("@acme/lib", () => ({
  validateShopName: jest.fn((s: string) => s),
}));
jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line import/first
import { createCampaign } from "../scheduler";

// eslint-disable-next-line import/first
import {
  renderTemplate,
  sendCampaignEmail,
  setupTest,
  shop,
  teardown,
} from "./testUtils";

describe("createCampaign – templates rendering", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardown();
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
});

