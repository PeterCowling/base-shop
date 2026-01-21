import type { SKU } from "@acme/types";

interface Props {
  skus?: SKU[];
  /** Attributes to display from each SKU (e.g. price, stock) */
  attributes: Array<Extract<keyof SKU, string>>;
  /** Read initial list from URL param when no skus provided (comma-separated) */
  fromUrlParam?: string;
  /** Whether to resolve URL tokens by id (default) or slug */
  resolveBy?: "id" | "slug";
}

/**
 * Display a simple comparison table for selected products.
 */
export default function ProductComparisonBlock({ skus = [], attributes }: Props) {
  const list = skus;
  if (!list.length || !attributes.length) return null;

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="border px-2 py-1 text-start">Product</th>
          {attributes.map((attr) => (
            <th key={attr} className="border px-2 py-1 text-start capitalize">
              {attr}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.map((sku) => (
          <tr key={sku.id}>
            <td className="border px-2 py-1">{sku.title}</td>
            {attributes.map((attr) => (
              <td key={attr} className="border px-2 py-1">
                {typeof sku[attr] === "boolean"
                  ? sku[attr]
                    ? "✓"
                    : "✕"
                  : String(sku[attr] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
