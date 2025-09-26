// apps/cms/src/app/cms/shop/[shop]/pages/new/componenteditor/page.tsx

import ComponentEditorClient from "./ComponentEditorClient";

export const dynamic = "force-dynamic";

export default async function NewComponentEditorRoute({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">New component - {shop}</h1>
      <ComponentEditorClient />
    </>
  );
}

