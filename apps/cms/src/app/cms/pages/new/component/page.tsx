// apps/cms/src/app/cms/pages/new/component/page.tsx

import ComponentEditorClient from "./ComponentEditorClient";

export const dynamic = "force-dynamic";

export default async function NewGlobalComponentPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Create component – CMS</h1>
      <ComponentEditorClient />
    </>
  );
}

