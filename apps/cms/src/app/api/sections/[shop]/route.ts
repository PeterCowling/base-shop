import { type NextRequest,NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";
import { ulid } from "ulid";

import { nowIso } from "@acme/date-utils";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { deleteSection,getSections, saveSection, updateSection } from "@acme/platform-core/repositories/sections/index.server";
import { pageComponentSchema, type SectionTemplate } from "@acme/types";

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
    const pageRaw = parseInt(url.searchParams.get("page") || "", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 0;
    const pageSizeRaw = parseInt(url.searchParams.get("pageSize") || "0", 10) || 0;
    // Allow larger result sets to support shops with many sections
    const pageSize = page > 0 ? Math.min(500, Math.max(1, pageSizeRaw || 24)) : 0;

    const listRaw = await getSections(shop);

    // Ensure all sections have helpful tags for filtering in the UI
    const deriveTags = (s: SectionTemplate): string[] => {
      const tags = new Set<string>((s.tags || []).map((t) => t.toLowerCase()));
      tags.add("section");
      const label = (s.label || "").toLowerCase();
      const addIf = (cond: boolean, t: string) => { if (cond) tags.add(t); };
      addIf(/hero/.test(label), "hero");
      addIf(/feature/.test(label), "features");
      addIf(/testimonial/.test(label), "testimonials");
      addIf(/commerce|product|shop|grid|carousel/.test(label), "commerce");
      // Inspect template children for hints
      try {
        const root = s.template;
        const types: string[] =
          root && root.type === "Section" && Array.isArray(root.children)
            ? root.children.map((c: { type?: unknown }) => String(c?.type ?? "").toLowerCase())
            : [];
        addIf(types.includes("herobanner"), "hero");
        addIf(types.includes("productcarousel") || types.includes("productgrid"), "commerce");
        addIf(types.includes("multicolumn"), "features");
        addIf(types.includes("testimonial") || types.includes("testimonials"), "testimonials");
        addIf(types.includes("image"), "image");
        addIf(types.includes("button"), "cta");
      } catch {}
      return Array.from(tags);
    };

    const list: SectionTemplate[] = listRaw.map((s) => ({ ...s, tags: deriveTags(s) }));

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

    const pageForMeta = page > 0 ? page : 1;
    const pageSizeForMeta = page > 0 ? pageSize : filtered.length;

    return NextResponse.json({ items, total, page: pageForMeta, pageSize: pageSizeForMeta, allTags });
  } catch {
    const t = await getServerTranslations("en");
    return NextResponse.json({ error: t("api.common.genericError") }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const t = await getServerTranslations("en");
    const { shop } = await context.params;
    const session = await ensureAuthorized();
    const ct = req.headers.get("content-type") || "";

    let label = t("api.cms.sections.untitled");
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

    const parsedTemplate = pageComponentSchema.parse(template);
    const now = nowIso();
    const section: SectionTemplate = {
      id: ulid(),
      label,
      status: "draft",
      template: parsedTemplate,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user?.email ?? "unknown",
    };
    const saved = await saveSection(shop, section, undefined);
    return NextResponse.json(saved, { status: 201 });
  } catch {
    const t = await getServerTranslations("en");
    return NextResponse.json({ error: t("api.common.genericError") }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const t = await getServerTranslations("en");
    const { shop } = await context.params;
    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: t("api.cms.sections.missingId") }, { status: 400 });
    const list = await getSections(shop);
    const previous = list.find((s) => s.id === id);
    if (!previous) return NextResponse.json({ error: t("api.cms.sections.unknownId") }, { status: 404 });
    const patch: Partial<SectionTemplate> & { id: string; updatedAt: string } = { id, updatedAt: previous.updatedAt };
    if (typeof body.label === "string") patch.label = body.label;
    if (body.status === "draft" || body.status === "published") patch.status = body.status;
    if (body.template !== undefined) {
      try {
        patch.template = pageComponentSchema.parse(body.template);
      } catch {
        return NextResponse.json({ error: t("api.cms.sections.invalidTemplate") }, { status: 400 });
      }
    }
    const updated = await updateSection(shop, patch, previous);
    return NextResponse.json(updated);
  } catch {
    const t = await getServerTranslations("en");
    return NextResponse.json({ error: t("api.common.genericError") }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const t = await getServerTranslations("en");
    const { shop } = await context.params;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: t("api.cms.sections.missingId") }, { status: 400 });
    await deleteSection(shop, id);
    return NextResponse.json({ ok: true });
  } catch {
    const t = await getServerTranslations("en");
    return NextResponse.json({ error: t("api.common.genericError") }, { status: 400 });
  }
}
