// apps/cms/src/app/cms/shop/[shop]/pages/page.tsx

import { canWrite } from "@auth";
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@acme/lib";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
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
  if (!(await checkShopExists(shop))) return notFound();
  const [session, initial] = await Promise.all([
    getServerSession(authOptions),
    getPages(shop),
  ]);
  const writable = canWrite(session?.user.role);
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Pages – {shop}</h2>
      <Suspense fallback={<p>Loading pages…</p>}>
        <PagesClient shop={shop} initial={initial} canWrite={writable} />
      </Suspense>
    </div>
  );
}
