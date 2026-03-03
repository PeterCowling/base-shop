import { notFound } from "next/navigation";

import { readInventory } from "@acme/platform-core/repositories/inventory.server";
import { getProductById } from "@acme/platform-core/repositories/products.server";

import { InventoryEditor } from "@/components/admin/InventoryEditor.client";
import { ProductForm } from "@/components/admin/ProductForm.client";

const SHOP = "caryina";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  const [product, inventory] = await Promise.all([
    getProductById(SHOP, id),
    readInventory(SHOP),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        <a
          href="/admin/products"
          className="inline-flex min-h-11 min-w-11 items-center text-sm underline underline-offset-2"
        >
          ← Products
        </a>
        <h1 className="text-2xl font-display">{product.title.en}</h1>
      </div>

      <ProductForm product={product} />
      <InventoryEditor productSku={product.sku} inventoryItems={inventory} />
    </div>
  );
}
