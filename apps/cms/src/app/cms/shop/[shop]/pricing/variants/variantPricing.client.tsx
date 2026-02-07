"use client";

/* eslint-disable ds/no-arbitrary-tailwind -- COM-0001 [ttl=2026-12-31] layout tokens pending DS refactor */

import { useEffect, useState } from "react";

import { getCsrfToken } from "@acme/lib/security";
import type { VariantPricing } from "@acme/platform-core/types/variants";

import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@/components/atoms/shadcn";

type Props = {
  shop: string;
  initial: VariantPricing[];
};

function emptyRow(): VariantPricing {
  return {
    id: "",
    productSlug: "",
    size: "",
    color: "",
    price: 0,
    currency: "USD",
    stripePriceId: "",
  };
}

export default function VariantPricingClient({ shop, initial }: Props) {
  const [rows, setRows] = useState<VariantPricing[]>(() => initial.length ? initial : [emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setRows(initial.length ? initial : [emptyRow()]);
  }, [initial]);

  const setRow = (idx: number, patch: Partial<VariantPricing>) => {
    setRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const save = async () => {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const payload = rows.map((r) => ({
        ...r,
        id: r.id.trim(),
        productSlug: r.productSlug.trim(),
        size: r.size.trim(),
        color: r.color.trim(),
        currency: r.currency.trim() || "USD",
        stripePriceId: r.stripePriceId.trim(),
        price: Number(r.price),
      }));

      for (const [idx, row] of payload.entries()) {
        if (!row.id || !row.productSlug || !row.size || !row.color || !row.stripePriceId) {
          setError(`Row ${idx + 1}: id, productSlug, size, color, and stripePriceId are required.`);
          return;
        }
        if (!Number.isInteger(row.price) || row.price < 0) {
          setError(`Row ${idx + 1}: price must be a non-negative integer (cents).`);
          return;
        }
      }

      const csrf = getCsrfToken() ?? "";
      const res = await fetch(`/api/shop/${shop}/variants`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ variants: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save variants");
      }
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Variants</h2>
          <p className="text-sm text-muted-foreground">
            Each row is a purchasable variant. Price is in minor units (cents). Stripe price ID is required for checkout.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={addRow}
            disabled={busy}
          >
            Add row
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90"
            onClick={save}
            disabled={busy}
          >
            Save variants
          </Button>
        </div>
      </div>

      <Textarea
        label="Notes (optional)"
        value={notes}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
        placeholder="Deployment or release notes for this pricing change…"
        className="min-h-[72px]"
      />

      <div className="overflow-auto rounded-2xl border border-border/10 bg-surface-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product slug</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Price (cents)</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Stripe price ID</TableHead>
              <TableHead className="w-[96px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Input
                    value={row.id}
                    onChange={(e) => setRow(idx, { id: e.target.value })}
                    placeholder="classic-kids-sand"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.productSlug}
                    onChange={(e) => setRow(idx, { productSlug: e.target.value })}
                    placeholder="classic"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.size}
                    onChange={(e) => setRow(idx, { size: e.target.value })}
                    placeholder="kids"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.color}
                    onChange={(e) => setRow(idx, { color: e.target.value })}
                    placeholder="sand"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.price}
                    onChange={(e) => setRow(idx, { price: Number(e.target.value) || 0 })}
                    inputMode="numeric"
                    placeholder="3400"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.currency}
                    onChange={(e) => setRow(idx, { currency: e.target.value })}
                    placeholder="USD"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.stripePriceId}
                    onChange={(e) => setRow(idx, { stripePriceId: e.target.value })}
                    placeholder="price_xxx"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-xl"
                    onClick={() => removeRow(idx)}
                    disabled={busy || rows.length <= 1}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error && <p className="text-sm text-danger-foreground">{error}</p>}
      {saved && !error && <p className="text-sm text-success-foreground">Saved variants.</p>}
    </div>
  );
}
