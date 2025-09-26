// apps/cms/src/app/cms/shop/[shop]/pages/edit/component/page.tsx

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditComponentBuilderRoute() {
  // Components are CMS-wide. Redirect to the global editor.
  redirect("/cms/pages/edit/component");
}
