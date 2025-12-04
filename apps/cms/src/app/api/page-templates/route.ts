import { NextRequest, NextResponse } from "next/server";
import {
  checkoutPageTemplates,
  corePageTemplates,
  homePageTemplates,
  productPageTemplates,
  shopPageTemplates,
} from "@acme/templates";

/**
 * GET /cms/api/page-templates
 *
 * Returns a lightweight list of core page templates backed by
 * `@acme/templates`. Each entry exposes a human-readable name and the
 * underlying PageBuilder components tree suitable for seeding pages.
 */
export async function GET(req?: NextRequest) {
  const group = (() => {
    if (!req?.url) return null;
    const { searchParams } = new URL(req.url);
    const value = searchParams.get("group");
    return value ? value.toLowerCase() : null;
  })();

  const catalog =
    group === "home"
      ? homePageTemplates
      : group === "shop" || group === "plp"
        ? shopPageTemplates
        : group === "product" || group === "pdp"
          ? productPageTemplates
          : group === "checkout"
            ? checkoutPageTemplates
            : corePageTemplates;

  const templates = catalog.map((tpl) => ({
    id: tpl.id,
    name: tpl.label,
    category: tpl.category,
    pageType: tpl.pageType,
    version: tpl.version,
    origin: tpl.origin ?? "core",
    previewImage: tpl.previewImage ?? null,
    components: tpl.components,
  }));
  return NextResponse.json(templates);
}
