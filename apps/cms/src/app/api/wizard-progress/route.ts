// apps/cms/src/app/api/wizard-progress/route.ts
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import * as fsSync from "node:fs";
import path from "node:path";
import {
  wizardStateSchema,
  stepStatusSchema,
  type StepStatus,
} from "@cms/app/cms/wizard/schema";

interface UserRecord {
  state: unknown;
  completed: Record<string, StepStatus>;
}

interface DB {
  [userId: string]: UserRecord | unknown;
}

function resolveFile(): string {
  let dir = process.cwd();
  while (true) {
    const candidateDir = path.join(dir, "data", "cms");
    if (fsSync.existsSync(candidateDir)) {
      return path.join(candidateDir, "wizard-progress.json");
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "cms", "wizard-progress.json");
}

const FILE = resolveFile();

async function readDb(): Promise<DB> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(buf) as DB;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* ignore */
  }
  return {};
}

async function writeDb(db: DB): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({}, { status: 401 });
  }
  const db = await readDb();
  const entry = db[session.user.id];
  if (entry && typeof entry === "object" && "state" in entry) {
    return NextResponse.json(entry as UserRecord);
  }
  return NextResponse.json({ state: entry ?? {}, completed: {} });
}

export async function PUT(req: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { stepId, data, completed } = body as {
      stepId?: string | null;
      data?: unknown;
      completed?: StepStatus | Record<string, StepStatus>;
    };
    const parsed = wizardStateSchema.partial().safeParse(data ?? {});
    if (stepId && data && !parsed.success) {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }
    const db = await readDb();
    let record: UserRecord = { state: {}, completed: {} };
    const existing = db[session.user.id];
    if (existing && typeof existing === "object" && "state" in existing) {
      record = existing as UserRecord;
    } else if (existing) {
      record.state = existing;
    }
    if (!stepId) {
      record = { state: {}, completed: {} };
    } else {
      record.state = { ...(record.state as object), ...parsed.data };
      if (
        typeof completed === "string" &&
        stepStatusSchema.safeParse(completed).success
      ) {
        record.completed[stepId] = completed;
      }
    }
    if (completed && typeof completed === "object" && !stepId) {
      record.completed = completed as Record<string, StepStatus>;
    }
    db[session.user.id] = record;
    await writeDb(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { stepId, completed } = body as {
      stepId?: string;
      completed?: StepStatus;
    };
    if (!stepId || !stepStatusSchema.safeParse(completed).success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const db = await readDb();
    let record: UserRecord = { state: {}, completed: {} };
    const existing = db[session.user.id];
    if (existing && typeof existing === "object" && "state" in existing) {
      record = existing as UserRecord;
    } else if (existing) {
      record.state = existing;
    }
    record.completed[stepId] = completed;
    db[session.user.id] = record;
    await writeDb(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
