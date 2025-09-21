import { promises as fs } from "node:fs";
import path from "node:path";
const SCHEDULES_PATH = path.join(process.cwd(), "apps", "cms", "data", "cms", "page-schedules.json");
const PROCESSED_PATH = path.join(process.cwd(), "apps", "cms", "data", "cms", "page-schedules.processed.json");
async function readJson(file, fallback) {
    try {
        const buf = await fs.readFile(file, "utf8");
        return JSON.parse(buf);
    }
    catch (_a) {
        return fallback;
    }
}
async function writeJson(file, value) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}
export default {
    async scheduled() {
        const store = await readJson(SCHEDULES_PATH, {});
        const processed = await readJson(PROCESSED_PATH, {});
        const now = Date.now();
        for (const [shop, byPage] of Object.entries(store)) {
            for (const [pageId, list] of Object.entries(byPage)) {
                for (const s of list) {
                    if (processed[s.id])
                        continue;
                    const due = Date.parse(s.publishAt);
                    if (!Number.isFinite(due))
                        continue;
                    if (due <= now) {
                        // Minimal stub: log ready-to-publish
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
    },
};
