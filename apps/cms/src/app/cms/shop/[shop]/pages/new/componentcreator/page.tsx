// apps/cms/src/app/cms/shop/[shop]/pages/new/componentcreator/page.tsx

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewComponentCreatorRoute({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  redirect(`/cms/shop/${shop}/pages/new/component`);
}
