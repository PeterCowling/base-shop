/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useState } from "react";

import type { ProductPublication } from "@acme/platform-core/products";

type Props = {
  shop: string;
  /** Existing product to edit, or null to create a new one. */
  product: ProductPublication | null;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  sku: string;
  title: string;
  description: string;
  /** Decimal string displayed to user; converted to minor units on submit. */
  priceDec: string;
  currency: string;
  status: "draft" | "active" | "archived";
  forSale: boolean;
};

function toFormState(p: ProductPublication | null): FormState {
  if (!p) {
    return {
      sku: "",
      title: "",
      description: "",
      priceDec: "",
      currency: "EUR",
      status: "draft",
      forSale: true,
    };
  }
  return {
    sku: p.sku,
    title: p.title.en,
    description: p.description.en,
    priceDec: (p.price / 100).toFixed(2),
    currency: p.currency,
    status: (["draft", "active", "archived"] as const).includes(
      p.status as "draft" | "active" | "archived",
    )
      ? (p.status as "draft" | "active" | "archived")
      : "draft",
    forSale: p.forSale ?? true,
  };
}

const INPUT_CLS =
  "w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus:ring-1 focus:ring-gate-accent";
const LABEL_CLS = "block text-xs font-medium text-gate-muted mb-0.5";

export function ProductForm({ shop, product, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(form.priceDec) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Price must be a positive number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isEdit = product !== null;
      const url = isEdit
        ? `/api/inventory/${encodeURIComponent(shop)}/products/${product.id}`
        : `/api/inventory/${encodeURIComponent(shop)}/products`;
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        price: priceCents,
        currency: form.currency,
        status: form.status,
        forSale: form.forSale,
      };
      if (!isEdit) {
        body.sku = form.sku;
      }
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError("session-expired");
          return;
        }
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      onSaved();
    } catch (err: unknown) {
      setError((err as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gate-ink">
        {product ? "Edit Product" : "New Product"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {!product && (
          <div>
            <label className={LABEL_CLS} htmlFor="pf-sku">
              SKU *
            </label>
            <input
              id="pf-sku"
              className={INPUT_CLS}
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              required
              placeholder="e.g. bag-silver"
            />
          </div>
        )}

        <div>
          <label className={LABEL_CLS} htmlFor="pf-title">
            Title *
          </label>
          <input
            id="pf-title"
            className={INPUT_CLS}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="Product title"
          />
        </div>

        <div>
          <label className={LABEL_CLS} htmlFor="pf-description">
            Description
          </label>
          <textarea
            id="pf-description"
            className={`${INPUT_CLS} resize-y`}
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS} htmlFor="pf-price">
              Price (e.g. 25.00) *
            </label>
            <input
              id="pf-price"
              type="number"
              step="0.01"
              min="0.01"
              className={INPUT_CLS}
              value={form.priceDec}
              onChange={(e) => set("priceDec", e.target.value)}
              required
              placeholder="25.00"
            />
          </div>
          <div>
            <label className={LABEL_CLS} htmlFor="pf-currency">
              Currency
            </label>
            <input
              id="pf-currency"
              className={INPUT_CLS}
              value={form.currency}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="EUR"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS} htmlFor="pf-status">
              Status
            </label>
            <select
              id="pf-status"
              className={INPUT_CLS}
              value={form.status}
              onChange={(e) => set("status", e.target.value as FormState["status"])}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              id="pf-for-sale"
              type="checkbox"
              checked={form.forSale}
              onChange={(e) => set("forSale", e.target.checked)}
              className="h-3 w-3"
            />
            <label htmlFor="pf-for-sale" className="text-xs text-gate-ink">
              For sale
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger-fg">
            {error === "session-expired" ? (
              <>
                Your session has expired.{" "}
                <a href="/login" className="underline">
                  Log in again
                </a>
              </>
            ) : (
              error
            )}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-gate-accent px-3 py-1 text-xs font-medium text-gate-on-accent hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : product ? "Save" : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded border border-gate-border px-3 py-1 text-xs font-medium text-gate-muted hover:text-gate-ink disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
