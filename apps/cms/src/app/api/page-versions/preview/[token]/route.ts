import { type NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import crypto from "crypto";
import path from "path";

import { readJsonFile } from "@/lib/server/jsonIO";

type PreviewLink = {
  token: string;
  shop: string;
  pageId: string;
  versionId: string;
  createdAt: string;
  expiresAt?: string;
  passwordHash?: string;
};

type VersionEntry = {
  id: string;
  label: string;
  timestamp: string;
  components: unknown[];
  editor?: Record<string, unknown>;
};

type VersionsStore = Record<string, Record<string, VersionEntry[]>>;
type LinksStore = Record<string, PreviewLink>;

const STORE_BASE = process.env.DATA_ROOT
  ? path.join(process.env.DATA_ROOT, "..", "cms")
  : path.join(process.cwd(), "data", "cms");
const LINKS_PATH = path.join(STORE_BASE, "page-preview-links.json");
const VERSIONS_PATH = path.join(STORE_BASE, "page-versions.json");

async function readLinks(): Promise<LinksStore> {
  return readJsonFile<LinksStore>(LINKS_PATH, {});
}

async function readVersions(): Promise<VersionsStore> {
  return readJsonFile<VersionsStore>(VERSIONS_PATH, {});
}

/**
 * Timing-safe comparison for legacy SHA-256 hashes.
 * Prevents timing attacks by always comparing in constant time.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify password against stored hash.
 * Supports both Argon2id (preferred) and legacy SHA-256 hashes.
 */
async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  // Argon2 hashes start with $argon2
  if (storedHash.startsWith("$argon2")) {
    return argon2.verify(storedHash, password);
  }
  // Legacy SHA-256 hash (64 hex chars) - use timing-safe comparison
  const computed = crypto.createHash("sha256").update(password).digest("hex");
  return timingSafeCompare(computed, storedHash);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const links = await readLinks();
  const link = links[token];
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check TTL expiration (if expiresAt is set)
  if (link.expiresAt && Date.now() > new Date(link.expiresAt).getTime()) {
    return NextResponse.json({ error: "Link expired" }, { status: 401 });
  }

  // Accept password from query param (for backwards compatibility) or body
  // Query param support allows existing shared links to work
  const password = new URL(req.url).searchParams.get("pw");
  if (link.passwordHash) {
    const ok = await verifyPassword(link.passwordHash, password ?? "");
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const versions = await readVersions();
  const list = versions[link.shop]?.[link.pageId] ?? [];
  const v = list.find((e) => e.id === link.versionId);
  if (!v) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  return NextResponse.json({
    shop: link.shop,
    pageId: link.pageId,
    versionId: v.id,
    label: v.label,
    timestamp: v.timestamp,
    components: v.components,
    editor: v.editor,
  });
}
