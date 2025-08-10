// apps/cms/src/app/api/wizard-progress/route.ts
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import * as fsSync from "node:fs";
import path from "node:path";
import { wizardStateSchema } from "@cms/app/cms/wizard/schema";

interface DB {
  [userId: string]: unknown;
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
  const data = db[session.user.id] ?? {};
  return NextResponse.json(data);
}

export async function PUT(req: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = wizardStateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }
    const db = await readDb();
    db[session.user.id] = parsed.data;
    await writeDb(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
