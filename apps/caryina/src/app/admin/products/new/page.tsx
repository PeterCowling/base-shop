import { ProductForm } from "@/components/admin/ProductForm.client";

export default function AdminProductNewPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-display">New product</h1>
      <ProductForm />
    </div>
  );
}
