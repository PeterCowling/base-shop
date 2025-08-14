import type { SKU } from "@acme/types";

interface Props {
  skus?: SKU[];
  /** Attributes to display from each SKU (e.g. price, stock) */
  attributes: Array<keyof SKU>;
}

/**
 * Display a simple comparison table for selected products.
 */
export default function ProductComparisonBlock({ skus = [], attributes }: Props) {
  if (!skus.length || !attributes.length) return null;

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
        {skus.map((sku) => (
          <tr key={sku.id}>
            <td className="border px-2 py-1">{sku.title}</td>
            {attributes.map((attr) => (
              <td key={attr} className="border px-2 py-1">
                {String(sku[attr] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

