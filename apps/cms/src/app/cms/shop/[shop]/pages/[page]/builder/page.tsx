// apps/cms/src/app/cms/shop/[shop]/pages/[page]/builder/page.tsx

import { updatePage } from "@cms/actions/pages/update";
import { getPages } from "@platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";
import { notFound } from "next/navigation";
import PageBuilderClient from "./PageBuilderClient";

export const dynamic = "force-dynamic";

interface Params {
  shop: string;
  page: string; // slug or id
}

export default async function PageBuilderRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop, page: key } = await params;
  const pages: Page[] = await getPages(shop);
  // Allow editing by slug (preferred) or by id when slug is not yet set
  const current = pages.find((p) => p.slug === key || p.id === key);
  if (!current) return notFound();
  const pagesNav = {
    items: [
      { label: "New page", value: "__new__", href: `/cms/shop/${shop}/pages/new/page` },
      ...pages.map((p) => ({
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

  return (
    <>
      <PageBuilderClient
        page={current}
        history={current.history}
        onSave={save}
        onPublish={publish}
        pagesNav={pagesNav}
      />
    </>
  );
}
