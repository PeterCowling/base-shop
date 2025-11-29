// apps/cms/src/app/api/configurator-progress/route.ts
import "@acme/zod-utils/initZod";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
// Use the server translation loader; alias to avoid React Hooks lint
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import { writeJsonFile } from "@/lib/server/jsonIO";
import path from "path";
import {
  configuratorStateSchema,
  stepStatusSchema,
  type StepStatus,
} from "@cms/app/cms/wizard/schema";
import { z } from "zod";

interface UserRecord {
  state: unknown;
  completed: Record<string, StepStatus>;
}

interface DB {
  [userId: string]: UserRecord | unknown;
}

const dbSchema = z.record(z.unknown());

const putBodySchema = z
  .object({
    stepId: z.string().nullish(),
    data: configuratorStateSchema.partial().optional(),
    completed: z
      .union([stepStatusSchema, z.record(stepStatusSchema)])
      .optional(),
  })
  .strict();

const patchBodySchema = z
  .object({
    stepId: z.string(),
    completed: stepStatusSchema,
  })
  .strict();

function resolveFile(): string {
  let dir = process.cwd();
  while (true) {
    const candidateDir = path.join(dir, "data", "cms");
    // Probes a known workspace directory; no user input involved
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Probing known workspace dir; no user input
    if (fsSync.existsSync(candidateDir)) {
      const newFile = path.join(candidateDir, "configurator-progress.json");
      const oldFile = path.join(candidateDir, "wizard-progress.json");
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Migrating known file names within controlled data dir
      if (!fsSync.existsSync(newFile) && fsSync.existsSync(oldFile)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Rename between two fixed filenames in same dir
        fsSync.renameSync(oldFile, newFile);
      }
      return newFile;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const candidateDir = path.resolve(process.cwd(), "data", "cms");
  const newFile = path.join(candidateDir, "configurator-progress.json");
  const oldFile = path.join(candidateDir, "wizard-progress.json");
  if (!fsSync.existsSync(newFile) && fsSync.existsSync(oldFile)) {
    fsSync.renameSync(oldFile, newFile);
  }
  return newFile;
}

const FILE = resolveFile();

async function readDb(): Promise<DB> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Reading a path derived from cwd and constants
    const buf = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(buf) as DB;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* ignore */
  }
  return {};
}

async function writeDb(db: unknown): Promise<void> {
  const parsed = dbSchema.safeParse(db ?? {});
  if (!parsed.success) {
    // User-facing error should be translated by caller
    throw new TypeError("api.common.invalidRequest");
  }
  const payload = parsed.data;
  const json = JSON.stringify(payload, null, 2);
  const tmp = `${FILE}.${Date.now()}.tmp`;
  try {
    console.log("[configurator-progress] write", { // i18n-exempt -- CMS-2134 [ttl=2026-03-31]
      file: FILE,
      tmp,
      bytes: Buffer.byteLength(json, "utf8"),
    });
  } catch {}
  await writeJsonFile(tmp, payload);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Atomic rename of temp file to fixed target
  await fs.rename(tmp, FILE);
}

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !userId) {
    return NextResponse.json({}, { status: 401 });
  }
  const db = await readDb();
  const entry = db[userId];
  if (entry && typeof entry === "object" && "state" in entry) {
    return NextResponse.json(entry as UserRecord);
  }
  return NextResponse.json({ state: entry ?? {}, completed: {} });
}

export async function PUT(req: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !userId) {
    const t = await getTranslations("en");
    return NextResponse.json({ error: t("api.common.unauthorized") }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = putBodySchema.safeParse(body);
    if (!parsed.success) {
      const t = await getTranslations("en");
      return NextResponse.json({ error: t("api.common.invalidRequest") }, { status: 400 });
    }
    const { stepId, data, completed } = parsed.data;
    const db = await readDb();
    let record: UserRecord = { state: {}, completed: {} };
    const existing = db[userId];
    if (existing && typeof existing === "object" && "state" in existing) {
      record = existing as UserRecord;
    } else if (existing) {
      record.state = existing;
    }
    if (!stepId) {
      record = { state: {}, completed: {} };
    } else {
      record.state = { ...(record.state as object), ...(data ?? {}) };
      if (typeof completed === "string" && stepId) {
        record.completed[stepId] = completed;
      }
    }
    if (completed && typeof completed === "object" && !stepId) {
      record.completed = completed as Record<string, StepStatus>;
    }
    db[userId] = record;
    await writeDb(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    const t = await getTranslations("en");
    const key = err instanceof TypeError ? err.message : "api.common.invalidRequest";
    return NextResponse.json({ error: t(key) }, { status: 400 });
  }
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !userId) {
    const t = await getTranslations("en");
    return NextResponse.json({ error: t("api.common.unauthorized") }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      const t = await getTranslations("en");
      return NextResponse.json({ error: t("api.common.invalidRequest") }, { status: 400 });
    }
    const { stepId, completed } = parsed.data;
    const db = await readDb();
    let record: UserRecord = { state: {}, completed: {} };
    const existing = db[userId];
    if (existing && typeof existing === "object" && "state" in existing) {
      record = existing as UserRecord;
    } else if (existing) {
      record.state = existing;
    }
    record.completed[stepId] = completed;
    db[userId] = record;
    await writeDb(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    const t = await getTranslations("en");
    const key = err instanceof TypeError ? err.message : "api.common.invalidRequest";
    return NextResponse.json({ error: t(key) }, { status: 400 });
  }
}
