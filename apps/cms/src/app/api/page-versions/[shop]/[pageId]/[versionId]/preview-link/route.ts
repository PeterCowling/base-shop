import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";
import crypto from "crypto";
import argon2 from "argon2";
import { ensureAuthorized } from "@cms/actions/common/auth";

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

const STORE_BASE = process.env.DATA_ROOT
  ? path.join(process.env.DATA_ROOT, "..", "cms")
  : path.join(process.cwd(), "data", "cms");
const STORE_PATH = path.join(STORE_BASE, "page-preview-links.json");

async function readStore(): Promise<Store> {
  return readJsonFile<Store>(STORE_PATH, {});
}

async function writeStore(store: Store): Promise<void> {
  await writeJsonFile(STORE_PATH, store);
}

async function hashPassword(pw: string): Promise<string> {
  return argon2.hash(pw);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; versionId: string }> },
) {
  try {
    await ensureAuthorized();
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
      passwordHash: password ? await hashPassword(password) : undefined,
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
    const message = (err as Error).message;
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
