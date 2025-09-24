import {
  setupTest,
  teardown,
  shop,
  validateShopName,
  resolveSegment,
} from "./testUtils";
import { createCampaign } from "../scheduler";

describe("createCampaign – validation and input errors", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
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
});

