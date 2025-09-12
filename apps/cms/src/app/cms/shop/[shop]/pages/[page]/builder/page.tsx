// apps/cms/src/app/cms/shop/[shop]/pages/[page]/builder/page.tsx

import { updatePage } from "@cms/actions/pages/update";
import { getPages } from "@platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type PageBuilderComponent from "@ui/components/cms/PageBuilder";

type PageBuilderProps = React.ComponentProps<typeof PageBuilderComponent>;
const PageBuilder = dynamic<PageBuilderProps>(
  () => import("@ui/components/cms/PageBuilder"),
);
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
  const pages: Page[] = await getPages(shop);
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
      <p className="mb-4 text-sm text-muted-foreground">
        Hold <kbd>Shift</kbd> while resizing to snap a component to full
        width or height. Use the editor buttons for quick 100% sizing and
        press <kbd>Space</kbd>/<kbd>Enter</kbd> then arrow keys to move
        components.
      </p>
      <PageBuilder
        page={current}
        history={current.history}
        onSave={save}
        onPublish={publish}
      />
    </>
  );
}
