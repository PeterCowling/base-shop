import { readRepo } from "@acme/platform-core/repositories/products.server";

const SHOP = "caryina";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await readRepo(SHOP);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-display">Products</h1>
        <a
          href="/admin/products/new"
          className="btn-primary min-h-[44px] rounded-full px-6 py-2.5 text-sm"
        >
          + New product
        </a>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start">
              <th className="pb-3 pr-4 font-medium">Title</th>
              <th className="pb-3 pr-4 font-medium">SKU</th>
              <th className="pb-3 pr-4 font-medium">Price</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-3 pr-4">{p.title.en}</td>
                <td className="py-3 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-3 pr-4">€{(p.price / 100).toFixed(2)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3">
                  <a
                    href={`/admin/products/${p.id}`}
                    className="text-sm underline underline-offset-2"
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
