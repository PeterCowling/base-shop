import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";
import crypto from "crypto";

type PreviewLink = {
  id: string; // same as token for simplicity
  token: string;
  shop: string;
  pageId: string;
  versionId: string;
  createdAt: string;
  passwordHash?: string;
};

type Store = Record<string, PreviewLink>; // token -> link

const STORE_PATH = path.join(process.cwd(), "data", "cms", "page-preview-links.json");

async function readStore(): Promise<Store> {
  return readJsonFile<Store>(STORE_PATH, {});
}

async function writeStore(store: Store): Promise<void> {
  await writeJsonFile(STORE_PATH, store);
}

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; versionId: string }> },
) {
  try {
    const { shop, pageId, versionId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === "string" && body.password.trim() ? body.password : undefined;

    const token = crypto.randomBytes(16).toString("hex");
    const createdAt = new Date().toISOString();
    const link: PreviewLink = {
      id: token,
      token,
      shop,
      pageId,
      versionId,
      createdAt,
      passwordHash: password ? hashPassword(password) : undefined,
    };

    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      store[token] = link;
      await writeStore(store);
    });

    // Shareable viewer URL and the raw API URL
    const url = `/cms/preview/${token}`;
    const apiUrl = `/cms/api/page-versions/preview/${token}`;
    return NextResponse.json({ ...link, url, apiUrl }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
