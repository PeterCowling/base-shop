// apps/cms/src/app/api/page-templates/[name]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { corePageTemplates } from "@acme/templates";

/**
 * GET /cms/api/page-templates/[name]
 *
 * Returns the components for a single core template. The `name` path
 * segment is matched against the template id; callers should pass one
 * of the ids from `corePageTemplates` (for example "core.page.home.default").
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const t = await getServerTranslations("en");
  const { name } = await context.params;
  const safeName = String(name).replace(/[^a-zA-Z0-9._-]/g, "");

  const tpl =
    corePageTemplates.find((t) => t.id === safeName) ??
    corePageTemplates.find((t) => t.id.endsWith(`.${safeName}`));

  if (!tpl) {
    return NextResponse.json({ error: t("api.common.notFound") }, { status: 404 });
  }

  return NextResponse.json({
    id: tpl.id,
    name: tpl.label,
    category: tpl.category,
    pageType: tpl.pageType,
    version: tpl.version,
    origin: tpl.origin ?? "core",
    previewImage: tpl.previewImage ?? null,
    components: tpl.components,
  });
}
