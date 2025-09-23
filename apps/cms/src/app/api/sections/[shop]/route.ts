import { NextResponse, type NextRequest } from "next/server";
import { getSections, saveSection, updateSection, deleteSection } from "@platform-core/repositories/sections/index.server";
import { sectionTemplateSchema, type SectionTemplate } from "@acme/types";
import { ensureAuthorized } from "@cms/actions/common/auth";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const tagsParam = url.searchParams.getAll("tag");
    const tagCsv = url.searchParams.get("tags");
    const tagsFilter = [
      ...tagsParam,
      ...((tagCsv ? tagCsv.split(",") : []) as string[]),
    ]
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "0", 10) || 0);
    const pageSizeRaw = parseInt(url.searchParams.get("pageSize") || "0", 10) || 0;
    const pageSize = page > 0 ? Math.min(100, Math.max(1, pageSizeRaw || 24)) : 0;

    const list = await getSections(shop);

    // No filters/pagination → preserve legacy shape (array)
    if (!q && tagsFilter.length === 0 && page === 0) {
      return NextResponse.json(list);
    }

    const filtered = list.filter((s) => {
      const matchQ = !q || s.label.toLowerCase().includes(q) || (s.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchTags = !tagsFilter.length || tagsFilter.every((needle) => (s.tags || []).map((t) => t.toLowerCase()).includes(needle));
      return matchQ && matchTags;
    });

    const total = filtered.length;
    const items = page > 0 ? filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize) : filtered;
    const allTags = Array.from(
      filtered.reduce((acc, s) => {
        (s.tags || []).forEach((t) => acc.add(t));
        return acc;
      }, new Set<string>())
    ).sort();

    return NextResponse.json({ items, total, page: page || 1, pageSize: page ? pageSize : filtered.length, allTags });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const session = await ensureAuthorized();
    const ct = req.headers.get("content-type") || "";

    let label = "Untitled Section";
    let template: unknown = null;
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (typeof body.label === "string" && body.label) label = body.label;
      template = body.template ?? null;
    } else if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const l = fd.get("label");
      const t = fd.get("template");
      if (typeof l === "string" && l) label = l;
      if (typeof t === "string" && t) template = JSON.parse(t);
    }

    const parsedTemplate = sectionTemplateSchema.shape.template.parse(template);
    const now = nowIso();
    const section: SectionTemplate = {
      id: ulid(),
      label,
      status: "draft",
      template: parsedTemplate,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user.email ?? "unknown",
    };
    const saved = await saveSection(shop, section, undefined);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const list = await getSections(shop);
    const previous = list.find((s) => s.id === id);
    if (!previous) return NextResponse.json({ error: "Unknown id" }, { status: 404 });
    const patch: any = { id, updatedAt: previous.updatedAt };
    if (typeof body.label === "string") patch.label = body.label;
    if (body.status === "draft" || body.status === "published") patch.status = body.status;
    if (body.template !== undefined) {
      try {
        patch.template = sectionTemplateSchema.shape.template.parse(body.template);
      } catch (e) {
        return NextResponse.json({ error: "Invalid template" }, { status: 400 });
      }
    }
    const updated = await updateSection(shop, patch, previous);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteSection(shop, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
