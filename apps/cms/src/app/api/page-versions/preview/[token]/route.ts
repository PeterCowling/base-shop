import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile } from "@/lib/server/jsonIO";

type PreviewLink = {
  token: string;
  shop: string;
  pageId: string;
  versionId: string;
  createdAt: string;
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

const LINKS_PATH = path.join(process.cwd(), "data", "cms", "page-preview-links.json");
const VERSIONS_PATH = path.join(process.cwd(), "data", "cms", "page-versions.json");

async function readLinks(): Promise<LinksStore> {
  return readJsonFile<LinksStore>(LINKS_PATH, {});
}

async function readVersions(): Promise<VersionsStore> {
  return readJsonFile<VersionsStore>(VERSIONS_PATH, {});
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const links = await readLinks();
  const link = links[token];
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const password = new URL(req.url).searchParams.get("pw");
  if (link.passwordHash) {
    const crypto = await import("crypto");
    const ok = crypto.createHash("sha256").update(password ?? "").digest("hex") === link.passwordHash;
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

