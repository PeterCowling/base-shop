import { NextResponse } from "next/server";

import { requirePermission } from "@acme/auth";
import { deletePreset,listPresets, savePreset } from "@acme/platform-core/repositories/sections/presets.server";
import type { SectionPreset } from "@acme/types";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { shop: string } }) {
  try { await requirePermission("manage_pages"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { shop } = params;
  const items = await listPresets(shop);
  return NextResponse.json(items, { status: 200 });
}

export async function POST(req: Request, { params }: { params: { shop: string } }) {
  try { await requirePermission("manage_pages"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { shop } = params;
  const ctype = req.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    const body = (await req.json()) as { preset?: SectionPreset };
    if (!body?.preset) return NextResponse.json({ error: "Missing preset" }, { status: 400 });
    const saved = await savePreset(shop, body.preset);
    return NextResponse.json(saved, { status: 200 });
  }
  // Form submission support from simple admin page
  const form = await req.formData();
  if (form.get("__json") === "1") {
    const label = String(form.get("label") || "");
    const lockedRaw = String(form.get("locked") || "").trim();
    const templateRaw = String(form.get("template") || "");
    try {
      const template = JSON.parse(templateRaw);
      const preset: SectionPreset = {
        id: `${Date.now()}`,
        label,
        template,
        locked: lockedRaw ? lockedRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "editor",
      };
      const saved = await savePreset(shop, preset);
      return NextResponse.json(saved, { status: 200 });
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "Unsupported content-type" }, { status: 400 });
}

export async function DELETE(req: Request, { params }: { params: { shop: string } }) {
  try { await requirePermission("manage_pages"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { shop } = params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deletePreset(shop, id);
  return NextResponse.json({ ok: true }, { status: 200 });
}
