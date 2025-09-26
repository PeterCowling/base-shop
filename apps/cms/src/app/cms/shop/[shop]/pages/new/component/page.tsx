// apps/cms/src/app/cms/shop/[shop]/pages/new/component/page.tsx

import ComponentEditorClient from "../componenteditor/ComponentEditorClient";

export const dynamic = "force-dynamic";

export default async function NewComponentPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Create component – {shop}</h1>
      <ComponentEditorClient />
    </>
  );
}

