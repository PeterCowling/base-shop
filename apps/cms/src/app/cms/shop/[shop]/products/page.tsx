// apps/cms/src/app/cms/shop/[shop]/products/page.tsx

import { Button } from "@/components/ui/button";
import { createDraft } from "@cms/actions/products";
import { authOptions } from "@cms/auth/options";
import { readRepo } from "@platform-core/repositories/json";
import ProductsTable from "@ui/components/cms/ProductsTable";
import { getServerSession } from "next-auth";

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const [session, rows] = await Promise.all([
    getServerSession(authOptions),
    readRepo<ProductPublication>(shop),
  ]);

  const isAdmin = session
    ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(
        session.user.role
      )
    : false;

  async function onCreate() {
    "use server";
    await createDraft(shop);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products – {shop}</h2>

        {isAdmin && (
          <form action={onCreate}>
            <Button className="bg-primary text-white" type="submit">
              New product
            </Button>
          </form>
        )}
      </div>

      <ProductsTable shop={shop} rows={rows} isAdmin={isAdmin} />

      {!isAdmin && (
        <p className="mt-4 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700">
          You are signed in as a <b>viewer</b>. Editing is disabled.
        </p>
      )}
    </>
  );
}
