import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { mockJson, useHandlers } from "@tests/msw/server";

const ROOT = process.cwd();
const DOWNLOAD_RATES_SCRIPT = path.resolve(ROOT, "scripts/download-rates.mjs");
const GENERATE_GUIDES_SCRIPT = path.resolve(ROOT, "scripts/generate-guides-index.ts");
const VALIDATE_HOWTO_SCRIPT = path.resolve(ROOT, "scripts/validate-how-to-get-here-content.ts");

const RATES_URL =
  "https://drive.google.com/uc?export=download&id=14-V7KCInwlHvqZFG7nm1fwi0tyW1aJix";

async function runScript(absolutePath: string) {
  const url = pathToFileURL(absolutePath);
  url.searchParams.set("vitest", `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await import(url.href);
}

function trackEnv(name: string, value: string, store: Array<() => void>) {
  const restore = vi.stubEnv(name, value);
  if (typeof restore === "function") {
    store.push(restore);
  }
}

describe.sequential("prebuild scripts", () => {
  describe("download-rates.mjs", () => {
    let tmpDir: string;
    let envRestores: Array<() => void>;

    beforeEach(async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), "download-rates-"));
      envRestores = [];
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
      while (envRestores.length) {
        const restore = envRestores.pop();
        restore?.();
      }
    });

    it("persists the fetched calendar to disk", async () => {
      const destination = path.join(tmpDir, "rates.json");

      trackEnv("CI", "", envRestores);
      trackEnv("SKIP_RATE_DOWNLOAD", "", envRestores);
      trackEnv("RATES_DST_FILE", destination, envRestores);

      useHandlers(
        mockJson("get", RATES_URL, {
          dorm: [
            { date: "2025-07-01", nr: 90, currency: "EUR" },
            { date: "2025-07-02", nr: 95, currency: "EUR" },
          ],
          private: [
            { date: "2025-07-01", nr: 160, currency: "EUR" },
            { date: "2025-07-02", nr: 165, currency: "EUR" },
          ],
        }),
      );

      await runScript(DOWNLOAD_RATES_SCRIPT);

      const downloaded = JSON.parse(await readFile(destination, "utf8"));
      expect(downloaded).toMatchInlineSnapshot(`
        {
          "dorm": [
            {
              "currency": "EUR",
              "date": "2025-07-01",
              "nr": 90,
            },
            {
              "currency": "EUR",
              "date": "2025-07-02",
              "nr": 95,
            },
          ],
          "private": [
            {
              "currency": "EUR",
              "date": "2025-07-01",
              "nr": 160,
            },
            {
              "currency": "EUR",
              "date": "2025-07-02",
              "nr": 165,
            },
          ],
        }
      `);
    });
  });

  describe("generate-guides-index.ts", () => {
    let tmpDir: string;
    let envRestores: Array<() => void>;

    beforeEach(async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), "generate-guides-"));
      envRestores = [];
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
      while (envRestores.length) {
        const restore = envRestores.pop();
        restore?.();
      }
    });

    it("emits deterministic guide and tag indexes", async () => {
      const guidesOut = path.join(tmpDir, "guides.index.ts");
      const tagsOut = path.join(tmpDir, "tags.index.ts");

      trackEnv("GUIDES_INDEX_OUT_FILE", guidesOut, envRestores);
      trackEnv("TAGS_INDEX_OUT_FILE", tagsOut, envRestores);

      await runScript(GENERATE_GUIDES_SCRIPT);

      const guidesBody = await readFile(guidesOut, "utf8");
      const tagsBody = await readFile(tagsOut, "utf8");

      expect(guidesBody).toMatchSnapshot();
      expect(tagsBody).toMatchSnapshot();
    });
  });

  describe("validate-how-to-get-here-content.ts", () => {
    let envRestores: Array<() => void>;

    beforeEach(() => {
      envRestores = [];
    });

    afterEach(() => {
      while (envRestores.length) {
        const restore = envRestores.pop();
        restore?.();
      }
    });

    it("prints a success summary when the dataset is healthy", async () => {
      trackEnv("VALIDATE_HOW_TO_BINDINGS", "", envRestores);

      const logs: string[] = [];
      const errors: string[] = [];
      const logSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
        logs.push(args.map(String).join(" "));
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation((...args) => {
        errors.push(args.map(String).join(" "));
      });

      try {
        await runScript(VALIDATE_HOWTO_SCRIPT);
      } finally {
        logSpy.mockRestore();
        errorSpy.mockRestore();
      }

      expect(errors).toEqual([]);
      expect(logs.at(-1)).toMatchInlineSnapshot(
        `"✅ Validated how-to-get-here JSON (17 locales, 18 routes, basic checks)"`,
      );
    });
  });
});