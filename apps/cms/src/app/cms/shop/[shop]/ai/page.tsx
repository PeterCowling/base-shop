import { checkShopExists } from "@acme/lib";
import { notFound } from "next/navigation";
import AiFeedPanel from "./AiFeedPanel";

export const revalidate = 0;

export default async function AiFeedPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">AI Feed – {shop}</h2>
      <AiFeedPanel shop={shop} />
    </div>
  );
}
