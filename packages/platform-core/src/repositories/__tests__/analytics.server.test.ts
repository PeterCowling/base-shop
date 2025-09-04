import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import type { AnalyticsEvent, AnalyticsAggregates } from "../../analytics";

let listEvents: (shop?: string) => Promise<AnalyticsEvent[]>;
let readAggregates: (shop: string) => Promise<AnalyticsAggregates>;
let root: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "analytics-"));
  process.env.DATA_ROOT = root;
  jest.resetModules();
  ({ listEvents, readAggregates } = await import("../analytics.server"));
});

describe("listEvents", () => {
  it("reads events from multiple shops", async () => {
    const shop1 = path.join(root, "shop1");
    const shop2 = path.join(root, "shop2");
    await fs.mkdir(shop1, { recursive: true });
    await fs.writeFile(
      path.join(shop1, "analytics.jsonl"),
      JSON.stringify({ type: "a", value: 1 }) + "\n" +
        JSON.stringify({ type: "b", value: 2 }) + "\n"
    );
    await fs.mkdir(shop2, { recursive: true });
    await fs.writeFile(
      path.join(shop2, "analytics.jsonl"),
      JSON.stringify({ type: "c", value: 3 }) + "\n"
    );

    const events = await listEvents();
    expect(events).toEqual([
      { type: "a", value: 1 },
      { type: "b", value: 2 },
      { type: "c", value: 3 },
    ]);
  });

  it("skips missing log files", async () => {
    const shop1 = path.join(root, "shop1");
    const shop2 = path.join(root, "shop2");
    await fs.mkdir(shop1, { recursive: true });
    await fs.writeFile(
      path.join(shop1, "analytics.jsonl"),
      JSON.stringify({ type: "a" }) + "\n"
    );
    await fs.mkdir(shop2, { recursive: true });

    const events = await listEvents();
    expect(events).toEqual([{ type: "a" }]);
  });

  it("ignores malformed JSON lines", async () => {
    const shop1 = path.join(root, "shop1");
    await fs.mkdir(shop1, { recursive: true });
    await fs.writeFile(
      path.join(shop1, "analytics.jsonl"),
      JSON.stringify({ type: "a" }) +
        "\nnot json\n" +
        "{bad}" +
        "\n" +
        JSON.stringify({ type: "b" }) +
        "\n"
    );

    const events = await listEvents();
    expect(events).toEqual([{ type: "a" }, { type: "b" }]);
  });
});

describe("readAggregates", () => {
  it("returns parsed aggregates when file exists", async () => {
    const shop = path.join(root, "shop1");
    await fs.mkdir(shop, { recursive: true });
    const agg: AnalyticsAggregates = {
      page_view: { d: 1 },
      order: { d: { count: 2, amount: 3 } },
      discount_redeemed: { d: { CODE: 4 } },
      ai_crawl: { d: 5 },
    };
    await fs.writeFile(
      path.join(shop, "analytics-aggregates.json"),
      JSON.stringify(agg)
    );

    const result = await readAggregates("shop1");
    expect(result).toEqual(agg);
  });

  it("returns defaults when file is missing", async () => {
    const shop = path.join(root, "shop1");
    await fs.mkdir(shop, { recursive: true });

    const result = await readAggregates("shop1");
    expect(result).toEqual({
      page_view: {},
      order: {},
      discount_redeemed: {},
      ai_crawl: {},
    });
  });
});
