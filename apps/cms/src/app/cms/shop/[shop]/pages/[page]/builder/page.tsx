// apps/cms/src/app/cms/shop/[shop]/pages/[page]/builder/page.tsx

import { updatePage } from "@cms/actions/pages.server";
import { getPages } from "@platform-core/repositories/pages/index.server";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const PageBuilder = dynamic(() => import("@/components/cms/PageBuilder"));
void PageBuilder;

export const revalidate = 0;

interface Params {
  shop: string;
  page: string;
}

export default async function PageBuilderRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop, page: slug } = await params;
  const pages = await getPages(shop);
  const current = pages.find((p) => p.slug === slug);
  if (!current) return notFound();

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
      <h1 className="mb-6 text-2xl font-semibold">
        Edit page - {shop}/{current.slug}
      </h1>
      <PageBuilder page={current} onSave={save} onPublish={publish} />
    </>
  );
}
