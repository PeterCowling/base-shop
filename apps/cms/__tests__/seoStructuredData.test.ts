/* eslint-disable import/first */
(process.env as Record<string, string>).NODE_ENV = "development";

import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

jest.setTimeout(120_000);

describe("SEO structured data persistence", () => {
  it("maps UI fields into structuredData string", async () => {
    await withTempRepo(async (dir) => {
      // authorize admin
      const { __setMockSession } = await import("next-auth");
      __setMockSession({ user: { role: "admin" } } as any);

      jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }));

      const actions = await import("../src/actions/shops.server");

      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("title", "Hello");
      fd.append("brand", "Acme");
      fd.append("offers", '{"price":"19.99","priceCurrency":"USD"}');
      fd.append(
        "aggregateRating",
        '{"ratingValue":4.5,"reviewCount":10}',
      );

      await actions.updateSeo("test", fd);

      const settingsFile = path.join(
        dir,
        "data",
        "shops",
        "test",
        "settings.json",
      );
      const settings = JSON.parse(await fs.readFile(settingsFile, "utf8"));
      const sd = settings?.seo?.en?.structuredData;
      expect(typeof sd).toBe("string");
      const parsed = JSON.parse(sd);
      expect(parsed.brand).toBe("Acme");
      expect(parsed.offers.priceCurrency).toBe("USD");
      expect(parsed.aggregateRating.ratingValue).toBe(4.5);
    });
  });
});

