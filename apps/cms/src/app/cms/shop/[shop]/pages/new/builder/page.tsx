// apps/cms/src/app/cms/shop/[shop]/pages/new/builder/page.tsx

import { createPage } from "@cms/actions/pages.server";
import type { Page } from "@types";
import dynamic from "next/dynamic";

const PageBuilder = dynamic(() => import("@/components/cms/PageBuilder"));
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
    seo: { title: "", description: "" },
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
      <PageBuilder page={blank} onSave={save} onPublish={publish} />
    </>
  );
}
