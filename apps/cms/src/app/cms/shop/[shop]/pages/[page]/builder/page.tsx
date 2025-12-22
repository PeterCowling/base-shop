// apps/cms/src/app/cms/shop/[shop]/pages/[page]/builder/page.tsx

import { updatePage } from "@cms/actions/pages/update";
import { getPages, savePage } from "@platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";
import { notFound } from "next/navigation";
import PageBuilderClient from "./PageBuilderClient";
import { checkoutPageTemplates, corePageTemplates } from "@acme/templates";
import { scaffoldPageFromTemplate } from "@acme/page-builder-core";
import { ulid } from "ulid";
import { buildPagePreview } from "@platform-core/shops/preview";
import type { PageBuilderProps } from "@acme/page-builder-ui";

export const dynamic = "force-dynamic";

interface Params {
  shop: string;
  page: string; // slug or id
}

const CHECKOUT_SLUG = "checkout";
const CHECKOUT_BLOCK_ALLOWLIST: NonNullable<PageBuilderProps["allowedBlockTypes"]> = [
  "Section",
  "CheckoutSection",
  "CartSection",
  "ValueProps",
  "Testimonials",
  "FAQBlock",
  "PoliciesAccordion",
  "Button",
  "Text",
  "Image",
  "Divider",
  "Spacer",
];

async function ensureCheckoutPage(shop: string, pages: Page[]): Promise<Page | undefined> {
  const existing = pages.find(
    (p) =>
      p.slug === CHECKOUT_SLUG ||
      p.stableId === CHECKOUT_SLUG ||
      p.stableId?.startsWith("core.page.checkout."),
  );
  if (existing) return existing;
  const template = checkoutPageTemplates[0];
  if (!template) return undefined;
  const page = scaffoldPageFromTemplate(
    template,
    { shopId: shop, locale: "en", primaryLocale: "en" },
    { id: ulid(), slug: CHECKOUT_SLUG },
  );
  return savePage(shop, page);
}

export default async function PageBuilderRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop, page: key } = await params;
  const pages: Page[] = await getPages(shop);
  // Allow editing by slug (preferred) or by id when slug is not yet set
  let current = pages.find((p) => p.slug === key || p.id === key);
  const isCheckout = key === CHECKOUT_SLUG;
  if (!current && isCheckout) {
    current = await ensureCheckoutPage(shop, pages);
  }
  if (!current) return notFound();
  const navPages = pages.some((p) => p.id === current?.id) ? pages : [...pages, current];
  const pagesNav = {
    items: [
      { label: "New page", value: "__new__", href: `/cms/shop/${shop}/pages/new/page` },
      ...navPages.map((p) => ({
        label: (p.slug || p.id),
        value: (p.slug || p.id),
        href: `/cms/shop/${shop}/pages/${p.slug || p.id}/builder`,
      })),
    ],
    current: (current.slug || current.id),
  } as { items: { label: string; value: string; href: string }[]; current: string };

  async function save(formData: FormData) {
    "use server";
    return updatePage(shop, formData);
  }

  async function publish(formData: FormData) {
    "use server";
    formData.set("status", "published");
    return updatePage(shop, formData);
  }

  const preview = buildPagePreview({ shopId: shop, pageId: current.id });
  const previewUrl = isCheckout
    ? current.status === "published"
      ? `/${CHECKOUT_SLUG}`
      : `/${CHECKOUT_SLUG}?preview=draft`
    : preview.url;
  const previewSource = isCheckout ? "Stage" : preview.source;

  return (
    <>
      <PageBuilderClient
        page={current}
        history={current.history}
        onSave={save}
        onPublish={publish}
        shopId={shop}
        templates={corePageTemplates}
        pagesNav={pagesNav}
        previewUrl={previewUrl}
        previewSource={previewSource}
        allowedBlockTypes={isCheckout ? CHECKOUT_BLOCK_ALLOWLIST : undefined}
      />
    </>
  );
}
