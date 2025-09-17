import {
  deleteMedia,
  getMediaOverview,
  listMedia,
  updateMediaMetadata,
  uploadMedia,
  type UpdateMediaMetadataFields,
} from "@cms/actions/media.server";
import { NextResponse } from "next/server";

function parseTagsValue(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value
      .map((tag) => (tag?.toString?.() ?? "").trim())
      .filter((tag) => tag.length > 0);
  }
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((tag) =>
            typeof tag === "string" ? tag.trim() : (tag?.toString?.() ?? "").trim()
          )
          .filter((tag) => tag.length > 0);
      }
      if (typeof parsed === "string") {
        const trimmed = parsed.trim();
        return trimmed ? [trimmed] : [];
      }
    } catch {
      /* ignore */
    }

    return value
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  return undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const summaryParam = url.searchParams.get("summary");
  const wantsSummary =
    summaryParam !== null && summaryParam !== "false" && summaryParam !== "0";
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  try {
    if (wantsSummary) {
      const overview = await getMediaOverview(shop);
      return NextResponse.json(overview);
    }

    const files = await listMedia(shop);
    return NextResponse.json(files);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const orientation =
    (url.searchParams.get("orientation") as "portrait" | "landscape" | null) ??
    "landscape";
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  try {
    const data = await req.formData();
    const item = await uploadMedia(shop, data, orientation);
    return NextResponse.json(item);
  } catch (err) {
    console.error("Upload failed", err);

    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const file = url.searchParams.get("file");
  if (!shop || !file) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  try {
    await deleteMedia(shop, file);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete failed", err);

    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const fileUrl = (body.file ?? body.fileUrl ?? body.url) as unknown;

  if (typeof fileUrl !== "string" || !fileUrl) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const fields: UpdateMediaMetadataFields = {};

  if ("title" in body) {
    fields.title = body.title == null ? null : body.title.toString();
  }

  if ("altText" in body) {
    fields.altText = body.altText == null ? null : body.altText.toString();
  }

  if ("tags" in body) {
    const parsedTags = parseTagsValue(body.tags);
    if (parsedTags === undefined && body.tags !== undefined) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }
    fields.tags = parsedTags ?? undefined;
  }

  try {
    const item = await updateMediaMetadata(shop, fileUrl, fields);
    return NextResponse.json(item);
  } catch (err) {
    console.error("Metadata update failed", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export const PUT = PATCH;
