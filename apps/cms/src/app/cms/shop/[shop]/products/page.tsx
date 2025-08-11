// apps/cms/src/app/cms/shop/[shop]/products/page.tsx

import { Button } from "@/components/atoms/shadcn";
import {
  createDraft,
  deleteProduct,
  duplicateProduct,
} from "@cms/actions/products.server";
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@lib/checkShopExists.server";
import type { ProductPublication } from "@acme/products";
import { readRepo } from "@platform-core/repositories/json.server";
import ProductsTable from "@ui/components/cms/ProductsTable.client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  /* ---------------------------------------------------------------------- */
  /*  Data loading                                                          */
  /* ---------------------------------------------------------------------- */
  const { shop } = await params;

  if (!(await checkShopExists(shop))) return notFound();

  const [session, rows] = await Promise.all([
    getServerSession(authOptions),
    readRepo<ProductPublication>(shop),
  ]);

  const isAdmin = session
    ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(
        session.user.role
      )
    : false;

  /* ---------------------------------------------------------------------- */
  /*  Server actions                                                        */
  /* ---------------------------------------------------------------------- */
  async function onCreate() {
    "use server";
    await createDraft(shop);
  }

  async function onDuplicate(shopParam: string, productId: string) {
    "use server";
    await duplicateProduct(shopParam, productId);
  }

  async function onDelete(shopParam: string, productId: string) {
    "use server";
    await deleteProduct(shopParam, productId);
  }

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
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

      <ProductsTable
        shop={shop}
        rows={rows}
        isAdmin={isAdmin}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />

      {!isAdmin && (
        <p className="mt-4 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700">
          You are signed in as a <b>viewer</b>. Editing is disabled.
        </p>
      )}
    </>
  );
}
