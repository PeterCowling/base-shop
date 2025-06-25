// apps/cms/src/app/(cms)/page.tsx
import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";

async function listShops(): Promise<string[]> {
  try {
    const shopsDir = path.resolve(process.cwd(), "data", "shops");
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export default async function CmsIndexPage() {
  const shops = await listShops();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Choose a shop</h2>
      <ul className="space-y-2">
        {shops.map((shop) => (
          <li key={shop}>
            <Link
              href={`/shop/${shop}/products`}
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
