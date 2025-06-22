// apps/cms/scr/app/(cms)/products/page.tsx

import { readRepo } from "@platform-core/repositories/json";
import DataTable from "@ui/components/cms/DataTable";
import Link from "next/link";
import { createDraft } from "../../../actions/products";

export const revalidate = 0; // always fresh for mock

export default async function ProductsPage() {
  const rows = await readRepo("abc");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Products</h2>
        <form action={createDraft}>
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-white">
            New product
          </button>
        </form>
      </div>

      <DataTable
        rows={rows}
        columns={[
          {
            header: "Title",
            render: (p) => (
              <Link className="underline" href={`/products/${p.id}/edit`}>
                {p.title.en}
              </Link>
            ),
          },
          { header: "SKU", render: (p) => p.sku, width: "10rem" },
          {
            header: "Price",
            render: (p) => `${(p.price / 100).toFixed(2)} ${p.currency}`,
          },
          { header: "Status", render: (p) => p.status },
        ]}
      />
    </>
  );
}
