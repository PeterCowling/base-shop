import { NextResponse } from "next/server";
import { corePageTemplates } from "@acme/templates";

/**
 * GET /cms/api/page-templates
 *
 * Returns a lightweight list of core page templates backed by
 * `@acme/templates`. Each entry exposes a human-readable name and the
 * underlying PageBuilder components tree suitable for seeding pages.
 */
export async function GET() {
  const templates = corePageTemplates.map((tpl) => ({
    name: tpl.label,
    components: tpl.components,
  }));
  return NextResponse.json(templates);
}
