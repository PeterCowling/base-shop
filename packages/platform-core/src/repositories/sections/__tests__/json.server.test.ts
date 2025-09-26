import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SectionTemplate } from "@acme/types";

function makeSection(id = "sec1"): SectionTemplate {
  return {
    id,
    label: "Hero",
    status: "draft",
    template: { type: "Section", id: "root", children: [] } as any,
    createdAt: "t1",
    updatedAt: "t1",
    createdBy: "tester",
  } as SectionTemplate;
}

describe("sections.json.server", () => {
  let repo: typeof import("../sections.json.server");
  let root: string;

  beforeAll(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sections-json-"));
    root = path.join(dir, "shops");
    process.env.DATA_ROOT = root;
    repo = await import("../sections.json.server");
  });

  it("performs CRUD operations using filesystem and history", async () => {
    const shop = "s1";
    const section = makeSection("sA");

    // save + list
    await repo.saveSection(shop, section, undefined);
    let list = await repo.getSections(shop);
    expect(list).toHaveLength(1);
    expect(list[0].label).toBe("Hero");

    // update
    const updated = await repo.updateSection(
      shop,
      { id: section.id, label: "Updated", updatedAt: section.updatedAt },
      section,
    );
    expect(updated.label).toBe("Updated");
    list = await repo.getSections(shop);
    expect(list[0].label).toBe("Updated");

    // delete
    await repo.deleteSection(shop, section.id);
    list = await repo.getSections(shop);
    expect(list).toHaveLength(0);
  });

  it("restoreSection inserts snapshot when missing and rewrites when present", async () => {
    const shop = "s2";
    const s1 = makeSection("z1");
    await repo.restoreSection(shop, s1);
    let list = await repo.getSections(shop);
    expect(list.map((s) => s.id)).toEqual(["z1"]);
    const s1b = { ...s1, label: "Alt" };
    await repo.restoreSection(shop, s1b);
    list = await repo.getSections(shop);
    expect(list[0].label).toBe("Alt");
  });
});

