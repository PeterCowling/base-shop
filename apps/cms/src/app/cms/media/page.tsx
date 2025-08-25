// apps/cms/src/app/cms/media/page.tsx
import Link from "next/link";
import { listShops } from "../../../lib/listShops";

export default async function MediaIndexPage() {
  const shops = await listShops();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Choose a shop</h2>
      <ul className="space-y-2">
        {shops.map((shop) => (
          <li key={shop}>
            <Link
              href={`/cms/shop/${shop}/media`}
              className="text-primary underline"
            >
              {shop}
            </Link>
          </li>
        ))}
        {shops.length === 0 && <li>No shops found.</li>}
      </ul>
    </div>
  );
}
