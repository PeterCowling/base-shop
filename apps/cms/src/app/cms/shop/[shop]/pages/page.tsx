// apps/cms/src/app/cms/shop/[shop]/pages/page.tsx

import { getPages } from "@platform-core/repositories/pages";
import { Suspense } from "react";
import PagesClient from "./PagesClient";

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function PagesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const initial = await getPages(shop);
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Pages – {shop}</h2>
      <Suspense fallback={<p>Loading pages…</p>}>
        <PagesClient shop={shop} initial={initial} />
      </Suspense>
    </div>
  );
}
