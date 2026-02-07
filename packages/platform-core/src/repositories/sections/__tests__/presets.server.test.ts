import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { SectionPreset } from "@acme/types";

describe("sections.presets.server", () => {
  let repo: typeof import("../presets.server");
  const shop = "demo";

  beforeAll(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "section-presets-"));
    process.env.DATA_ROOT = path.join(dir, "root");
    repo = await import("../presets.server");
  });

  it("lists, saves, and deletes presets", async () => {
    const preset: SectionPreset = {
      id: "p1",
      label: "Hero Preset",
      template: { type: "Section", id: "root", children: [] } as any,
      createdAt: "t",
      updatedAt: "t",
      createdBy: "me",
    };

    let list = await repo.listPresets(shop);
    expect(list).toEqual([]);

    await repo.savePreset(shop, preset);
    list = await repo.listPresets(shop);
    expect(list.map((p) => p.id)).toEqual(["p1"]);

    await repo.savePreset(shop, { ...preset, label: "Updated" });
    list = await repo.listPresets(shop);
    expect(list[0].label).toBe("Updated");

    await repo.deletePreset(shop, preset.id);
    list = await repo.listPresets(shop);
    expect(list).toEqual([]);
  });
});

