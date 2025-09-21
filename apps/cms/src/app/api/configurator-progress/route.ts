// apps/cms/src/app/api/configurator-progress/route.ts
import "@acme/zod-utils/initZod";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fsSync.existsSync(candidateDir)) {
      const newFile = path.join(candidateDir, "configurator-progress.json");
      const oldFile = path.join(candidateDir, "wizard-progress.json");
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fsSync.existsSync(newFile) && fsSync.existsSync(oldFile)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename
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
    throw new TypeError("Invalid DB value");
  }
  const payload = parsed.data;
  const json = JSON.stringify(payload, null, 2);
  const tmp = `${FILE}.${Date.now()}.tmp`;
  try {
    console.log("[configurator-progress] write", {
      file: FILE,
      tmp,
      bytes: Buffer.byteLength(json, "utf8"),
    });
  } catch {}
  await writeJsonFile(tmp, payload);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = putBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
    if (err instanceof TypeError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
    if (err instanceof TypeError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
