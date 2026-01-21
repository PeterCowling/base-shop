import { NextResponse } from "next/server";

import { requirePermission } from "@acme/auth";
import { restoreSection } from "@acme/platform-core/repositories/sections/sections.json.server";
import type { SectionTemplate } from "@acme/types";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { shop: string } }) {
  try {
    await requirePermission("manage_pages");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { shop } = params;
    let snapshot: SectionTemplate | undefined;
    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      const body = (await req.json()) as { snapshot?: SectionTemplate };
      snapshot = body?.snapshot as SectionTemplate | undefined;
    } else {
      const form = await req.formData();
      const raw = form.get("snapshot");
      if (typeof raw === "string") {
        try { snapshot = JSON.parse(raw) as SectionTemplate; } catch { /* ignore */ }
      }
    }
    if (!snapshot || typeof snapshot !== "object") {
      return NextResponse.json({ error: "Missing snapshot" }, { status: 400 });
    }
    const restored = await restoreSection(shop, snapshot as SectionTemplate);
    return NextResponse.json({ ok: true, section: restored }, { status: 200 });
  } catch (err) {
    console.error("sections restore failed", err);
    return NextResponse.json({ error: "Failed to restore" }, { status: 500 });
  }
}
