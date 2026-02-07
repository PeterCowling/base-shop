import { type NextRequest, NextResponse } from "next/server";

import {
  accessibilityPageTemplates,
  checkoutPageTemplates,
  cookiePageTemplates,
  corePageTemplates,
  homePageTemplates,
  // Legal & Compliance templates (LAUNCH-27)
  legalPageTemplates,
  privacyPageTemplates,
  productPageTemplates,
  returnsPageTemplates,
  shopPageTemplates,
  termsPageTemplates,
  vatPageTemplates,
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

  const catalog = (() => {
    switch (group) {
      case "home":
        return homePageTemplates;
      case "shop":
      case "plp":
        return shopPageTemplates;
      case "product":
      case "pdp":
        return productPageTemplates;
      case "checkout":
        return checkoutPageTemplates;
      // Legal & Compliance groups (LAUNCH-27)
      case "legal":
        return legalPageTemplates;
      case "terms":
        return termsPageTemplates;
      case "privacy":
        return privacyPageTemplates;
      case "cookie":
      case "cookies":
        return cookiePageTemplates;
      case "vat":
      case "tax":
        return vatPageTemplates;
      case "accessibility":
        return accessibilityPageTemplates;
      case "returns":
      case "refunds":
        return returnsPageTemplates;
      default:
        return corePageTemplates;
    }
  })();

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
