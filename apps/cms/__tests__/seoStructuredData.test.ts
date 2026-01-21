import fs from "node:fs/promises";
import path from "node:path";

import { withTempRepo } from "@acme/test-utils";

(process.env as Record<string, string>).NODE_ENV = "development";

jest.setTimeout(120_000);

describe("SEO structured data persistence", () => {
  it("maps UI fields into structuredData string", async () => {
    await withTempRepo(async (dir) => {
      // authorize admin
      const { __setMockSession } = await import("~test/mocks/next-auth");
      __setMockSession({ user: { role: "admin" } });

      jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }));

      const actions = await import("../src/actions/shops.server");

      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("title", "Hello");
      fd.append("description", "Test description");
      fd.append("structuredData", JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "brand": "Acme",
        "offers": { "price": "19.99", "priceCurrency": "USD" },
        "aggregateRating": { "ratingValue": 4.5, "reviewCount": 10 }
      }));

      const result = await actions.updateSeo("test", fd);
      if (result.errors) {
        throw new Error(`updateSeo failed: ${JSON.stringify(result.errors)}`);
      }

      const settingsFile = path.join(
        dir,
        "data",
        "shops",
        "test",
        "settings.json",
      );
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Reading a file within a controlled temp repo path in tests
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
