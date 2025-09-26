// apps/cms/src/app/cms/shop/[shop]/pages/new/page/page.tsx

import { createPage } from "@cms/actions/pages/create";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { fillLocales } from "@i18n/fillLocales";
import type { Page } from "@acme/types";
import PageBuilderClient from "./PageBuilderClient";

export const dynamic = "force-dynamic";

interface Params {
  shop: string;
}

export default async function NewPageBuilderRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const pages = await getPages(shop);

  const blank = {
    id: "",
    slug: "",
    status: "draft",
    components: [],
    seo: {
      title: fillLocales(undefined, ""),
      description: fillLocales(undefined, ""),
      image: fillLocales(undefined, ""),
      brand: fillLocales(undefined, ""),
      offers: fillLocales(undefined, ""),
      aggregateRating: fillLocales(undefined, ""),
    },
    createdAt: "",
    updatedAt: "",
    createdBy: "",
  } as Page;

  async function save(formData: FormData) {
    "use server";
    return createPage(shop, formData);
  }

  async function publish(formData: FormData) {
    "use server";
    formData.set("status", "published");
    return createPage(shop, formData);
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Create Page – {shop}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Hold <kbd>Shift</kbd> while resizing to snap a component to full size,
        use the editor buttons for quick 100% width or height, and press
        <kbd>Space</kbd>/<kbd>Enter</kbd> then arrow keys to move components.
      </p>
      <PageBuilderClient
        page={blank}
        onSave={save}
        onPublish={publish}
        pagesNav={{
          items: [
            { label: "New page", value: "__new__", href: `/cms/shop/${shop}/pages/new/page` },
            ...pages.map((p) => ({
              label: p.slug || p.id,
              value: p.slug || p.id,
              href: `/cms/shop/${shop}/pages/${p.slug || p.id}/builder`,
            })),
          ],
          current: "__new__",
        }}
      />
    </>
  );
}
