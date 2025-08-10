import listShops from "../listShops";
import Link from "next/link";

export default async function OrdersIndex() {
  const shops = await listShops();
  return (
    <ul className="space-y-2">
      {shops.map((s) => (
        <li key={s.id}>
          <Link href={`/cms/orders/${s.id}`} className="text-blue-600 underline">
            {s.id} orders
          </Link>
        </li>
      ))}
    </ul>
  );
}
