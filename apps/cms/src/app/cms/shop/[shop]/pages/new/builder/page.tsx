// apps/cms/src/app/cms/shop/[shop]/pages/new/builder/page.tsx

import { createPage } from "@cms/actions/pages.server";
import { fillLocales } from "@platform-core/utils";
import type { Page } from "@types";
import dynamic from "next/dynamic";

const PageBuilder = dynamic(() => import("@ui/components/cms/PageBuilder"));
void PageBuilder;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function NewPageBuilderRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;

  const blank: Page = {
    id: "",
    slug: "",
    status: "draft",
    components: [],
    seo: {
      title: fillLocales(undefined, ""),
      description: fillLocales(undefined, ""),
      image: fillLocales(undefined, ""),
    },
    createdAt: "",
    updatedAt: "",
    createdBy: "",
  };

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
      <h1 className="mb-6 text-2xl font-semibold">New page - {shop}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Hold <kbd>Shift</kbd> while resizing to snap a component to full size,
        use the editor buttons for quick 100% width or height, and press
        <kbd>Space</kbd>/<kbd>Enter</kbd> then arrow keys to move components.
      </p>
      <PageBuilder page={blank} onSave={save} onPublish={publish} />
    </>
  );
}
