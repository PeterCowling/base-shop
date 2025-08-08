import { checkShopExists } from "@lib/checkShopExists.server";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { notFound } from "next/navigation";
import InventoryForm from "./InventoryForm";

export const revalidate = 0;

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readInventory(shop);
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Inventory</h2>
      <InventoryForm shop={shop} initial={initial} />
    </div>
  );
}
