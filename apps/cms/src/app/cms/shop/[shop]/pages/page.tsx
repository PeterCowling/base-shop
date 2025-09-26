// apps/cms/src/app/cms/shop/[shop]/pages/page.tsx

import { redirect } from "next/navigation";

interface Params {
  shop: string;
}

export default async function PagesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  redirect(`/cms/shop/${shop}/pages/edit/page`);
}
