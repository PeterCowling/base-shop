// apps/cms/src/app/cms/shop/[shop]/pages/new/component/page.tsx

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewComponentPage() {
  // Components are CMS-wide. Redirect to global creator.
  redirect(`/cms/pages/new/component`);
}
