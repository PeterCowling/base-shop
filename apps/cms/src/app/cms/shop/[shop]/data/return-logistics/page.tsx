import { checkShopExists } from "@lib/checkShopExists.server";
import { readReturnLogistics } from "@platform-core/repositories/returnLogistics.server";
import { notFound } from "next/navigation";
import ReturnLogisticsForm from "./ReturnLogisticsForm";

export const revalidate = 0;

export default async function ReturnLogisticsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readReturnLogistics();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Return Logistics</h2>
      <ReturnLogisticsForm shop={shop} initial={initial} />
    </div>
  );
}
