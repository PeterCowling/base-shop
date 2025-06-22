import { readRepo } from "@platform-core/repositories/json";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function ProductEditor({
  params,
}: {
  params: { id: string };
}) {
  const products = await readRepo("abc");
  const product = products.find((p) => p.id === params.id);
  if (!product) return notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold">Edit product</h2>

      {/* Title */}
      <label className="block text-sm font-medium">Title (en)</label>
      <input
        defaultValue={product.title.en}
        className="w-full rounded-md border px-3 py-2 dark:bg-gray-900"
      />

      {/* Price */}
      <label className="block text-sm font-medium">Price (cents)</label>
      <input
        type="number"
        defaultValue={product.price}
        className="w-40 rounded-md border px-3 py-2 dark:bg-gray-900"
      />

      {/* Images preview */}
      <div className="flex gap-3">
        {product.images.map((src) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={96}
            height={96}
            className="rounded-md border"
          />
        ))}
      </div>

      {/* Save button — wiring in next slice */}
      <button
        disabled
        className="rounded-md bg-primary/60 px-4 py-2 text-sm text-white opacity-50"
      >
        Save (later)
      </button>
    </div>
  );
}
