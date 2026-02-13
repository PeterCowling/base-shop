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
import { setupTest, shop, teardown } from "./testUtils";

describe("createCampaign – persistence", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
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
});

