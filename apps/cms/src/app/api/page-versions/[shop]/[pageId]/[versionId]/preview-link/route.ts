import { type NextRequest, NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";
import argon2 from "argon2";
import crypto from "crypto";
import path from "path";

import { readJsonFile, withFileLock, writeJsonFile } from "@/lib/server/jsonIO";

/** Default TTL for preview links: 24 hours */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const TTL_MS = process.env.PREVIEW_LINK_TTL_HOURS
  ? parseInt(process.env.PREVIEW_LINK_TTL_HOURS, 10) * 60 * 60 * 1000
  : DEFAULT_TTL_MS;

type PreviewLink = {
  id: string; // same as token for simplicity
  token: string;
  shop: string;
  pageId: string;
  versionId: string;
  createdAt: string;
  expiresAt: string;
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; versionId: string }> },
) {
  // Require authenticated user
  try {
    await ensureAuthorized();
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }

  try {
    const { shop, pageId, versionId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === "string" && body.password.trim() ? body.password : undefined;

    const token = crypto.randomBytes(16).toString("hex");
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

    // Use Argon2id for password hashing (more secure than SHA-256)
    const passwordHash = password ? await argon2.hash(password) : undefined;

    const link: PreviewLink = {
      id: token,
      token,
      shop,
      pageId,
      versionId,
      createdAt,
      expiresAt,
      passwordHash,
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
