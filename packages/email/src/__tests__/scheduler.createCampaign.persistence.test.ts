import { setupTest, teardown, shop } from "./testUtils";
import { createCampaign } from "../scheduler";

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

