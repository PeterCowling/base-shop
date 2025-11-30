// apps/cms/src/app/cms/shop/[shop]/pages/page.tsx

import { checkShopExists } from "@acme/lib";
import { notFound, redirect } from "next/navigation";

interface Params {
  shop: string;
}

export default async function PagesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;

  if (!(await checkShopExists(shop))) return notFound();

  redirect(`/cms/shop/${shop}/pages/edit/page`);
}
