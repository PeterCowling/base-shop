import { NextResponse, type NextRequest } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";
import { getPages, savePage } from "@acme/platform-core/repositories/pages/index.server";
import { checkoutPageTemplates } from "@acme/templates";
import { scaffoldPageFromTemplate, type TemplateDescriptor } from "@acme/page-builder-core";
import type { Page } from "@acme/types";
import { ulid } from "ulid";

const CHECKOUT_SLUG = "checkout";

interface CheckoutPageSummary {
  id: string;
  slug: string;
  status: Page["status"];
  updatedAt: string;
  templateId?: string;
  previewPath: string;
  draftPreviewPath: string;
}

function serialize(
  page: Page,
  templateId?: string,
): CheckoutPageSummary {
  return {
    id: page.id,
    slug: page.slug || CHECKOUT_SLUG,
    status: page.status ?? "draft",
    updatedAt: page.updatedAt,
    templateId: page.stableId ?? templateId,
    previewPath: `/${CHECKOUT_SLUG}`,
    draftPreviewPath: `/${CHECKOUT_SLUG}?preview=draft`,
  };
}

function findTemplate(templateId?: string): TemplateDescriptor | undefined {
  if (templateId) {
    const explicit = checkoutPageTemplates.find((tpl) => tpl.id === templateId);
    if (explicit) return explicit;
  }
  return checkoutPageTemplates[0];
}

async function createCheckoutPage(
  shop: string,
  templateId?: string,
  createdBy?: string,
): Promise<{ page: Page; template: TemplateDescriptor } | { error: string }> {
  const template = findTemplate(templateId);
  if (!template) {
    return { error: "Checkout template unavailable" };
  }

  const page = scaffoldPageFromTemplate(template, {
    shopId: shop,
    locale: "en",
    primaryLocale: "en",
  }, {
    id: ulid(),
    slug: CHECKOUT_SLUG,
    createdBy: createdBy ?? "",
  });

  const saved = await savePage(shop, page);
  return { page: saved, template };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  try {
    await ensureAuthorized();
    const { shop } = await context.params;
    const pages = await getPages(shop);
    const checkout = pages.find(
      (p) =>
        p.slug === CHECKOUT_SLUG ||
        p.stableId === CHECKOUT_SLUG ||
        p.stableId?.startsWith("core.page.checkout."),
    );
    if (!checkout) {
      return NextResponse.json(
        { error: "Checkout page not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(serialize(checkout));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  try {
    const session = await ensureAuthorized();
    const { shop } = await context.params;
    let templateId: string | undefined;
    try {
      const body = (await req.json()) as { templateId?: unknown } | null;
      templateId = typeof body?.templateId === "string" ? body.templateId : undefined;
    } catch {
      /* ignore malformed JSON body */
    }

    const pages = await getPages(shop);
    const existing = pages.find(
      (p) =>
        p.slug === CHECKOUT_SLUG ||
        p.stableId === CHECKOUT_SLUG ||
        p.stableId?.startsWith("core.page.checkout."),
    );
    if (existing) {
      return NextResponse.json(serialize(existing, templateId));
    }

    const result = await createCheckoutPage(
      shop,
      templateId,
      session.user?.email ?? "unknown",
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(serialize(result.page, result.template.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
