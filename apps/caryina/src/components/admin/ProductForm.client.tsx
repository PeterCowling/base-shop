"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ProductPublication } from "@acme/types";
import type { MediaItem } from "@acme/types/MediaItem";

type MediaRow = { url: string; type: "image" | "video"; altText: string };

function mediaToRows(media: MediaItem[]): MediaRow[] {
  return media.map((m) => ({ url: m.url, type: m.type, altText: m.altText ?? "" }));
}

function priceToEuros(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}

function eurosToMinorUnits(euros: string): number {
  return Math.round(parseFloat(euros) * 100);
}

// --------------- Sub-components ---------------

interface MediaSectionProps {
  rows: MediaRow[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: keyof MediaRow, value: string) => void;
}

function MediaSection({ rows, onAdd, onRemove, onUpdate }: MediaSectionProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Media</legend>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={row.url}
            onChange={(e) => onUpdate(i, "url", e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            aria-label={`Media URL ${i + 1}`}
          />
          <select
            value={row.type}
            onChange={(e) => onUpdate(i, "type", e.target.value)}
            className="rounded-lg border border-border px-2 py-2 text-sm"
            aria-label={`Media type ${i + 1}`}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <input
            type="text"
            placeholder="Alt text"
            value={row.altText}
            onChange={(e) => onUpdate(i, "altText", e.target.value)}
            className="w-32 rounded-lg border border-border px-3 py-2 text-sm"
            aria-label={`Alt text ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
            aria-label={`Remove media ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg border border-border px-4 py-2 text-sm"
      >
        + Add media
      </button>
    </fieldset>
  );
}

interface FormActionsProps {
  isEdit: boolean;
  pending: boolean;
  onDelete: () => void;
}

function FormActions({ isEdit, pending, onDelete }: FormActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="btn-primary min-h-[44px] rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
      </button>
      {isEdit ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="min-h-[44px] rounded-full border border-destructive px-6 py-2.5 text-sm text-destructive disabled:opacity-50"
        >
          Delete
        </button>
      ) : null}
      <a
        href="/admin/products"
        className="flex min-h-[44px] items-center rounded-full border border-border px-6 py-2.5 text-sm"
      >
        Cancel
      </a>
    </div>
  );
}

// --------------- Main component ---------------

interface ProductFormProps {
  product?: ProductPublication;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [sku, setSku] = useState(product?.sku ?? "");
  const [title, setTitle] = useState(product?.title.en ?? "");
  const [description, setDescription] = useState(product?.description.en ?? "");
  const [price, setPrice] = useState(product ? priceToEuros(product.price) : "");
  const [status, setStatus] = useState<"draft" | "active">(
    product?.status === "active" ? "active" : "draft",
  );
  const [forSale, setForSale] = useState(product?.forSale !== false);
  const [mediaRows, setMediaRows] = useState<MediaRow[]>(
    product ? mediaToRows(product.media) : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addMediaRow() {
    setMediaRows((rows) => [...rows, { url: "", type: "image", altText: "" }]);
  }
  function removeMediaRow(i: number) {
    setMediaRows((rows) => rows.filter((_, idx) => idx !== i));
  }
  function updateMediaRow(i: number, field: keyof MediaRow, value: string) {
    setMediaRows((rows) => rows.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = parseFloat(price);
    if (!isEdit && !sku.trim()) { setError("SKU is required."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setError("Price must be greater than 0."); return; }

    setPending(true);
    try {
      const media = mediaRows
        .filter((r) => r.url.trim())
        .map((r) => ({ url: r.url.trim(), type: r.type, ...(r.altText.trim() ? { altText: r.altText.trim() } : {}) }));
      const payload = isEdit
        ? { title: title.trim(), description: description.trim(), price: eurosToMinorUnits(price), status, forSale, media }
        : { sku: sku.trim(), title: title.trim(), description: description.trim(), price: eurosToMinorUnits(price), status, forSale, media };
      const res = isEdit
        ? await fetch(`/admin/api/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/admin/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { router.push("/admin/products"); router.refresh(); }
      else { const d = (await res.json()) as { error?: string }; setError(d.error ?? "Something went wrong."); }
    } catch { setError("Network error. Please try again."); }
    finally { setPending(false); }
  }

  async function handleDelete() {
    if (!product || !confirm("Delete this product?")) return;
    setPending(true);
    try {
      const res = await fetch(`/admin/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) { router.push("/admin/products"); router.refresh(); }
      else setError("Delete failed.");
    } catch { setError("Network error."); }
    finally { setPending(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="pf-sku" className="block text-sm font-medium">
          SKU {!isEdit && <span aria-hidden>*</span>}
          {isEdit && <span className="ms-1 text-xs font-normal text-muted-foreground">(read-only)</span>}
        </label>
        <input
          id="pf-sku"
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required={!isEdit}
          readOnly={isEdit}
          placeholder={isEdit ? undefined : "e.g. silver-necklace-001"}
          className={`block w-full rounded-lg border border-border px-3 py-2 text-sm${isEdit ? " bg-muted text-muted-foreground" : ""}`}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="pf-title" className="block text-sm font-medium">
          Title <span aria-hidden>*</span>
        </label>
        <input id="pf-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="pf-description" className="block text-sm font-medium">Description</label>
        <textarea id="pf-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="pf-price" className="block text-sm font-medium">Price (€) <span aria-hidden>*</span></label>
          <input id="pf-price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pf-status" className="block text-sm font-medium">Status</label>
          <select id="pf-status" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "active")} className="block w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="pf-for-sale" type="checkbox" checked={forSale} onChange={(e) => setForSale(e.target.checked)} className="h-4 w-4" />
        <label htmlFor="pf-for-sale" className="text-sm">Available for sale</label>
      </div>
      <MediaSection rows={mediaRows} onAdd={addMediaRow} onRemove={removeMediaRow} onUpdate={updateMediaRow} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <FormActions isEdit={isEdit} pending={pending} onDelete={handleDelete} />
    </form>
  );
}
