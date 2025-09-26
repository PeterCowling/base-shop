import type { SKU } from "@acme/types";
import { PRODUCTS } from "@acme/platform-core/products";

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
export default function ProductComparisonBlock({ skus = [], attributes, fromUrlParam = "compare", resolveBy = "id" }: Props) {
  let list = skus;
  if ((!list || list.length === 0) && typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get(fromUrlParam);
      if (raw) {
        const tokens = raw.split(",").map((s) => s.trim()).filter(Boolean);
        list = PRODUCTS.filter((p) => tokens.includes(resolveBy === "id" ? p.id : p.slug)) as SKU[];
      }
    } catch {}
  }
  if (!list.length || !attributes.length) return null;

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="border px-2 py-1 text-left">Product</th>
          {attributes.map((attr) => (
            <th key={attr} className="border px-2 py-1 text-left capitalize">
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
