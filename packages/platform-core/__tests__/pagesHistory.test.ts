import fs from "node:fs/promises";
import path from "node:path";

import type { Page } from "@acme/types";

import { DATA_ROOT } from "../src/dataRoot";
import {
  diffHistory,
  savePage,
  updatePage,
} from "../src/repositories/pages/index.server";

jest.mock("../src/db", () => ({
  prisma: {
    page: {
      upsert: jest.fn().mockRejectedValue(new Error("no db")),
      update: jest.fn().mockRejectedValue(new Error("no db")),
      findMany: jest.fn().mockRejectedValue(new Error("no db")),
    },
  },
}));

const shop = "history-shop";

async function cleanup() {
  await fs.rm(path.join(DATA_ROOT, shop), { recursive: true, force: true });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("pages history", () => {
  it("records diff entries", async () => {
    const page: Page = {
      id: "p1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" }, description: { en: "" }, image: { en: "" } } as any,
      createdAt: "t0",
      updatedAt: "t0",
      createdBy: "tester",
    };
    await savePage(shop, page, undefined);
    const updated = await updatePage(
      shop,
      { id: page.id, updatedAt: page.updatedAt, slug: "start" },
      page
    );
    const history = await diffHistory(shop);
    expect(history).toHaveLength(2);
    expect(history[0].diff.slug).toBe("home");
    expect(history[1].diff.slug).toBe("start");
    expect(history[1].diff.updatedAt).toBe(updated.updatedAt);
  });
});
