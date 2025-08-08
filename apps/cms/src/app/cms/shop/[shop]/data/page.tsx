import Link from "next/link";

export default async function DataIndex({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Data</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link href={`/cms/shop/${shop}/data/inventory`} className="text-primary underline">
            Inventory
          </Link>
        </li>
        <li>
          <Link href={`/cms/shop/${shop}/data/rental/pricing`} className="text-primary underline">
            Rental Pricing
          </Link>
        </li>
        <li>
          <Link href={`/cms/shop/${shop}/data/return-logistics`} className="text-primary underline">
            Return Logistics
          </Link>
        </li>
      </ul>
    </div>
  );
}
