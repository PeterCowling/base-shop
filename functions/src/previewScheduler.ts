import { promises as fs } from "node:fs";
import path from "node:path";

type Schedule = {
  id: string;
  shop: string;
  pageId: string;
  versionId: string;
  publishAt: string; // ISO
  createdAt: string;
};

type Store = Record<string, Record<string, Schedule[]>>; // shop -> pageId -> schedules

const SCHEDULES_PATH = path.join(process.cwd(), "apps", "cms", "data", "cms", "page-schedules.json");
const PROCESSED_PATH = path.join(process.cwd(), "apps", "cms", "data", "cms", "page-schedules.processed.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

export default {
  async scheduled() {
    // Existing page scheduler stub (kept for compatibility)
    const store = await readJson<Store>(SCHEDULES_PATH, {});
    const processed = await readJson<Record<string, true>>(PROCESSED_PATH, {});
    const now = Date.now();

    for (const [shop, byPage] of Object.entries(store)) {
      for (const [pageId, list] of Object.entries(byPage)) {
        for (const s of list) {
          if (processed[s.id]) continue;
          const due = Date.parse(s.publishAt);
          if (!Number.isFinite(due)) continue;
          if (due <= now) {
            console.log(JSON.stringify({
              type: "ready-to-publish",
              shop,
              pageId,
              versionId: s.versionId,
              scheduleId: s.id,
              publishAt: s.publishAt,
              detectedAt: new Date().toISOString(),
            }));
            processed[s.id] = true;
          }
        }
      }
    }
    await writeJson(PROCESSED_PATH, processed);

    // New: section-level scheduler based on publishAt/expireAt fields in each section
    const shopsRoot = path.join(process.cwd(), "data", "shops");
    let shops: string[] = [];
    try {
      shops = (await fs.readdir(shopsRoot, { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      // no shops dir
      shops = [];
    }
    for (const shop of shops) {
      const sectionsFile = path.join(shopsRoot, shop, "sections.json");
      try {
        const buf = await fs.readFile(sectionsFile, "utf8");
        const sections = JSON.parse(buf) as Array<Record<string, unknown>>;
        let changed = false;
        const nowIso = new Date().toISOString();
        const nowMs = Date.parse(nowIso);
        for (const s of sections) {
          const publishAt = typeof s.publishAt === 'string' ? Date.parse(s.publishAt) : NaN;
          const expireAt = typeof s.expireAt === 'string' ? Date.parse(s.expireAt) : NaN;
          const withinWindow = (Number.isFinite(publishAt) ? publishAt <= nowMs : true) &&
            (Number.isFinite(expireAt) ? nowMs < expireAt : true);
          const desiredStatus = withinWindow ? "published" : "draft";
          if (s.status !== desiredStatus) {
            console.log(JSON.stringify({
              type: "section-status-change",
              shop,
              sectionId: s.id,
              from: s.status,
              to: desiredStatus,
              publishAt: s.publishAt,
              expireAt: s.expireAt,
              detectedAt: nowIso,
            }));
            s.status = desiredStatus as any;
            changed = true;
          }
        }
        if (changed) {
          await fs.writeFile(sectionsFile, JSON.stringify(sections, null, 2), "utf8");
        }
      } catch {
        // ignore missing or invalid sections.json
      }
    }
  },
};
