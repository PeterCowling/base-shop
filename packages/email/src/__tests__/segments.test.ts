import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { resolveSegment } from "../segments";

process.env.CART_COOKIE_SECRET = "secret";

describe("segments unsubscribe", () => {
  const shop = "seg-unsub";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
    await fs.writeFile(
      path.join(shopDir, "segments.json"),
      JSON.stringify([
        { id: "buyers", filters: [{ field: "type", value: "purchase" }] },
      ]),
      "utf8"
    );
    await fs.writeFile(
      path.join(shopDir, "analytics.jsonl"),
      JSON.stringify({ type: "purchase", email: "keep@example.com" }) +
        "\n" +
        JSON.stringify({ type: "purchase", email: "gone@example.com" }) +
        "\n",
      "utf8"
    );
    await fs.writeFile(
      path.join(shopDir, "unsubscribes.json"),
      JSON.stringify(["gone@example.com"]),
      "utf8"
    );
  });

  it("excludes unsubscribed emails", async () => {
    const emails = await resolveSegment(shop, "buyers");
    expect(emails).toEqual(["keep@example.com"]);
  });
});
