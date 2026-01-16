/* eslint-disable ds/enforce-layout-primitives, ds/no-arbitrary-tailwind -- COM-0001 [ttl=2026-12-31] MVP stock inflow UI pending DS refactor */

"use client";

import type {
  StockInflowEvent,
  StockInflowReport,
} from "@platform-core/types/stockInflows";
import { getCsrfToken } from "@acme/shared-utils";
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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReceiveResult =
  | { ok: true; duplicate: boolean; report: StockInflowReport; event: StockInflowEvent }
  | { ok: false; code: string; message: string; details?: unknown };

type DraftItem = {
  sku: string;
  productId: string;
  quantity: string;
  variantAttributes: Record<string, string>;
  extraVariantJson: string;
  inventoryKey?: string;
};

type InventoryRow = {
  sku: string;
  productId: string;
  quantity: number;
  variantAttributes: Record<string, string>;
};

type InventoryRowWithKey = InventoryRow & { key: string };

function parseVariantAttributesJson(
  input: string,
): { ok: true; value: Record<string, string> } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, value: {} };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Variant attributes must be valid JSON (e.g. {\"size\":\"M\"})." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Variant attributes must be a JSON object." };
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!key.trim()) return { ok: false, error: "Variant attribute keys must be non-empty strings." };
    if (typeof value !== "string") {
      return { ok: false, error: `Variant attribute '${key}' must be a string value.` };
    }
    out[key] = value;
  }
  return { ok: true, value: out };
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyRow(): DraftItem {
  return {
    sku: "",
    productId: "",
    quantity: "1",
    variantAttributes: {},
    extraVariantJson: "",
  };
}

function buildInventoryKey(item: InventoryRow): string {
  const variantPart = Object.entries(item.variantAttributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  return `${item.sku}::${variantPart || "no-variant"}`;
}

function normalizeVariantAttributes(attrs: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(attrs)
      .map(([k, v]) => [k.trim(), v.trim()])
      .filter(([k, v]) => k && v),
  );
}

function isSameVariant(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] || "") !== (b[key] || "")) return false;
  }
  return true;
}

export default function StockInflowsClient({
  shop,
  recent,
}: {
  shop: string;
  recent: StockInflowEvent[];
}) {
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey());
  const [note, setNote] = useState("");
  const [items, setItems] = useState<DraftItem[]>(() => [emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiveResult | null>(null);
  const [inventory, setInventory] = useState<InventoryRowWithKey[]>([]);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadInventory() {
      setInventoryLoading(true);
      setInventoryError(null);
      try {
        const res = await fetch(`/api/data/${shop}/inventory/export?format=json`);
        if (!res.ok) {
          const message = res.status === 403 ? "Missing inventory permission" : "Unable to load inventory snapshot.";
          throw new Error(message);
        }
        const json = (await res.json()) as Record<string, unknown>[];
        const rows: InventoryRowWithKey[] = json
          .map((item) => {
            const variantAttributes = Object.fromEntries(
              Object.entries(item)
                .filter(([k]) => k.startsWith("variant."))
                .map(([k, v]) => [k.slice("variant.".length), String(v)]),
            );
            const sku = String(item.sku ?? "").trim();
            const productId = String(item.productId ?? "").trim();
            const quantity = Number(item.quantity ?? 0);
            if (!sku || !productId || !Number.isFinite(quantity)) return null;
            const row: InventoryRow = { sku, productId, quantity, variantAttributes };
            return { ...row, key: buildInventoryKey(row) };
          })
          .filter((row): row is InventoryRowWithKey => Boolean(row));
        if (!cancelled) {
          setInventory(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setInventoryError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setInventoryLoading(false);
        }
      }
    }
    loadInventory();
    return () => {
      cancelled = true;
    };
  }, [shop]);

  const normalizedItems = useMemo(() => {
    return items
      .map((row) => ({
        sku: row.sku.trim(),
        productId: row.productId.trim(),
        quantity: row.quantity.trim(),
        variantAttributes: normalizeVariantAttributes(row.variantAttributes),
        extraVariantJson: row.extraVariantJson.trim(),
        inventoryKey: row.inventoryKey,
      }))
      .filter((row) => {
        const hasVariant = Object.values(row.variantAttributes).some(Boolean);
        return row.sku || row.productId || row.quantity || row.extraVariantJson || hasVariant;
      });
  }, [items]);

  const inventoryByKey = useMemo(() => new Map(inventory.map((row) => [row.key, row])), [inventory]);

  const variantKeys = useMemo(() => {
    const keys = new Set<string>();
    inventory.forEach((row) => Object.keys(row.variantAttributes).forEach((k) => keys.add(k)));
    items.forEach((row) => Object.keys(row.variantAttributes).forEach((k) => keys.add(k)));
    return Array.from(keys).sort();
  }, [inventory, items]);

  const findInventoryMatch = useCallback(
    (row: DraftItem) => {
      if (row.inventoryKey) {
        return inventoryByKey.get(row.inventoryKey);
      }
      const attrs = normalizeVariantAttributes(row.variantAttributes);
      return inventory.find(
        (item) =>
          item.sku === row.sku.trim() &&
          isSameVariant(item.variantAttributes, attrs),
      );
    },
    [inventory, inventoryByKey],
  );

  const setRow = useCallback((idx: number, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const next: DraftItem = { ...row, ...patch } as DraftItem;
        const shouldClearInventoryKey =
          patch.inventoryKey === undefined &&
          (Object.prototype.hasOwnProperty.call(patch, "sku") ||
            Object.prototype.hasOwnProperty.call(patch, "productId") ||
            Object.prototype.hasOwnProperty.call(patch, "variantAttributes"));
        if (shouldClearInventoryKey) {
          next.inventoryKey = undefined;
        }
        return next;
      }),
    );
  }, []);

  const addRow = useCallback(() => {
    setItems((prev) => [...prev, emptyRow()]);
  }, []);

  const removeRow = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const startNewReceipt = useCallback(() => {
    setIdempotencyKey(createIdempotencyKey());
    setNote("");
    setItems([emptyRow()]);
    setResult(null);
    setError(null);
  }, []);

  const submit = useCallback(
    async (dryRun: boolean) => {
      setError(null);
      setBusy(true);
      try {
        if (!normalizedItems.length) {
          setError("Add at least one line item.");
          return;
        }

        const parsedItems: Array<{
          sku: string;
          productId: string;
          quantity: number;
          variantAttributes?: Record<string, string>;
        }> = [];

        for (const [idx, row] of normalizedItems.entries()) {
          if (!row.sku) {
            setError(`Row ${idx + 1}: sku is required.`);
            return;
          }
          if (!row.productId) {
            setError(`Row ${idx + 1}: productId is required.`);
            return;
          }
          const qty = Number(row.quantity);
          if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
            setError(`Row ${idx + 1}: quantity must be a positive integer.`);
            return;
          }
          const mergedAttrs: Record<string, string> = { ...row.variantAttributes };
          const extraAttrs = parseVariantAttributesJson(row.extraVariantJson);
          if (extraAttrs.ok === false) {
            setError(`Row ${idx + 1}: ${extraAttrs.error}`);
            return;
          }
          for (const [key, value] of Object.entries(extraAttrs.value)) {
            if (mergedAttrs[key] && mergedAttrs[key] !== value) {
              setError(`Row ${idx + 1}: variant attribute '${key}' is set twice with different values.`);
              return;
            }
            mergedAttrs[key] = value;
          }

          parsedItems.push({
            sku: row.sku,
            productId: row.productId,
            quantity: qty,
            ...(Object.keys(mergedAttrs).length ? { variantAttributes: mergedAttrs } : {}),
          });
        }

        const csrf = getCsrfToken() ?? "";
        const res = await fetch(`/api/shop/${shop}/stock-inflows`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf,
          },
          body: JSON.stringify({
            idempotencyKey,
            dryRun,
            ...(note.trim() ? { note: note.trim() } : {}),
            items: parsedItems,
          }),
        });

        const json = (await res.json().catch(() => null)) as ReceiveResult | null;
        if (!res.ok || !json) {
          setError("Request failed.");
          return;
        }
        if (json.ok === false) {
          setError(json.message || "Request failed.");
          setResult(json);
          return;
        }

        setResult(json);
        if (!dryRun) {
          router.refresh();
          setIdempotencyKey(createIdempotencyKey());
        }
      } finally {
        setBusy(false);
      }
    },
    [idempotencyKey, note, normalizedItems, router, shop],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Stock inflow receipt</h2>
          <p className="text-sm text-muted-foreground">
            Preview applies validation only. Commit updates inventory and appends an immutable receipt log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={startNewReceipt}
            disabled={busy}
          >
            Start new
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => submit(true)}
            disabled={busy}
          >
            Preview
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90"
            onClick={() => submit(false)}
            disabled={busy}
          >
            Receive stock
          </Button>
        </div>
      </div>

        <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input
            label="Idempotency key"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            description="If you submit the same key twice, we’ll return the original receipt instead of double-receiving."
          />
          <Textarea
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Supplier, PO number, or context for this receipt…"
            className="min-h-[96px]"
          />
        </div>

        <div className="rounded-2xl border border-border/10 bg-surface-1 p-4">
          <h3 className="text-sm font-semibold">Schema & guardrails</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Each row is a quantity <span className="font-medium">delta</span> (inflow), not an absolute set. Select an existing
            inventory row to avoid mismatched variants and see the current quantity.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li><span className="font-medium text-foreground">sku</span>: variant SKU (required)</li>
            <li><span className="font-medium text-foreground">productId</span>: stable product id (required)</li>
            <li><span className="font-medium text-foreground">quantity</span>: positive integer (required)</li>
            <li><span className="font-medium text-foreground">variantAttributes</span>: structured fields (Size, Color, etc). If you need a new attribute key, add it in the “Additional variant attributes (JSON)” field.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Line items</h3>
            <p className="text-xs text-muted-foreground">
              Pick an existing inventory row to auto-fill sku/product/variants, or type a new variant and we’ll create it.
            </p>
          </div>
          <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={addRow} disabled={busy}>
            Add row
          </Button>
        </div>
        {inventoryLoading ? (
          <p className="text-sm text-muted-foreground">Loading inventory snapshot…</p>
        ) : inventoryError ? (
          <p className="text-sm text-danger-foreground">Inventory snapshot unavailable: {inventoryError}</p>
        ) : null}
        <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inventory row</TableHead>
                <TableHead>Identifiers</TableHead>
                <TableHead className="w-[120px]">Qty</TableHead>
                <TableHead>Variant attributes</TableHead>
                <TableHead className="w-[96px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row, idx) => {
                const matchedInventory = findInventoryMatch(row);
                const parsedQty = Number(row.quantity);
                const delta =
                  Number.isFinite(parsedQty) && matchedInventory
                    ? matchedInventory.quantity + parsedQty
                    : null;
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="space-y-2">
                        {inventory.length ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Use existing row</p>
                            <select
                              aria-label={`Row ${idx + 1} select inventory`}
                              value={row.inventoryKey ?? ""}
                              onChange={(e) => {
                                const key = e.target.value;
                                if (!key) {
                                  setRow(idx, { inventoryKey: undefined });
                                  return;
                                }
                                const selected = inventoryByKey.get(key);
                                if (selected) {
                                  setRow(idx, {
                                    sku: selected.sku,
                                    productId: selected.productId,
                                    variantAttributes: { ...selected.variantAttributes },
                                    extraVariantJson: "",
                                    inventoryKey: key,
                                  });
                                }
                              }}
                              className="w-full rounded-xl border border-border/60 bg-surface-1 px-3 py-2 text-sm shadow-sm focus:outline-none"
                            >
                              <option value="">Type manually</option>
                              {inventory.map((inv) => (
                                <option key={inv.key} value={inv.key}>
                                  {inv.sku} {Object.keys(inv.variantAttributes).length
                                    ? `(${Object.entries(inv.variantAttributes)
                                      .map(([k, v]) => `${k}:${v}`)
                                      .join(", ")})`
                                    : "(no variant)"}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No inventory snapshot yet.</p>
                        )}
                        {matchedInventory ? (
                          <p className="text-xs text-muted-foreground">
                            Current quantity: <span className="font-medium text-foreground">{matchedInventory.quantity}</span>
                            {delta !== null ? (
                              <> → <span className="font-medium text-foreground">{delta}</span></>
                            ) : null}
                          </p>
                        ) : row.sku || row.productId ? (
                          <p className="text-xs text-muted-foreground">Will create a new inventory row.</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Input
                          aria-label={`Row ${idx + 1} sku`}
                          value={row.sku}
                          onChange={(e) => setRow(idx, { sku: e.target.value })}
                          placeholder="sku-123"
                        />
                        <Input
                          aria-label={`Row ${idx + 1} productId`}
                          value={row.productId}
                          onChange={(e) => setRow(idx, { productId: e.target.value })}
                          placeholder="prod_abc"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Row ${idx + 1} quantity`}
                        value={row.quantity}
                        onChange={(e) => setRow(idx, { quantity: e.target.value })}
                        inputMode="numeric"
                        placeholder="1"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {variantKeys.length ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {variantKeys.map((key) => (
                              <Input
                                key={key}
                                aria-label={`Row ${idx + 1} variant ${key}`}
                                value={row.variantAttributes[key] ?? ""}
                                onChange={(e) =>
                                  setRow(idx, {
                                    variantAttributes: {
                                      ...row.variantAttributes,
                                      [key]: e.target.value,
                                    },
                                  })
                                }
                                placeholder={key}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No variants yet for this shop. Add keys in the JSON field if needed.
                          </p>
                        )}
                        <Textarea
                          aria-label={`Row ${idx + 1} additional variant attributes`}
                          value={row.extraVariantJson}
                          onChange={(e) => setRow(idx, { extraVariantJson: e.target.value })}
                          placeholder='Additional variant attributes as JSON (e.g. {"batch":"A1"})'
                          className="min-h-[72px]"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 rounded-xl"
                        onClick={() => removeRow(idx)}
                        disabled={busy || items.length <= 1}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {error && <p className="text-sm text-danger-foreground">{error}</p>}
      </div>

      {result?.ok && (
        <div className="space-y-4 rounded-2xl border border-border/10 bg-surface-1 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                {result.event.id === "dry-run" ? "Preview report" : "Receipt report"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.duplicate
                  ? "This idempotency key was already received — showing the original receipt."
                  : "Created/updated quantities shown below."}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{result.report.created}</span> created ·{" "}
              <span className="font-medium text-foreground">{result.report.updated}</span> updated
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-[120px]">Delta</TableHead>
                  <TableHead className="w-[140px]">Previous</TableHead>
                  <TableHead className="w-[140px]">Next</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.report.items.map((item) => (
                  <TableRow key={`${item.sku}|${JSON.stringify(item.variantAttributes)}`}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{item.sku}</div>
                        {Object.keys(item.variantAttributes).length ? (
                          <div className="text-xs text-muted-foreground">
                            {Object.entries(item.variantAttributes)
                              .map(([k, v]) => `${k}:${v}`)
                              .join(", ")}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">+{item.delta}</TableCell>
                    <TableCell className="text-muted-foreground">{item.previousQuantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.nextQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Recent receipts</h3>
        {recent.length ? (
          <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[190px]">Received</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[150px]">Created/Updated</TableHead>
                  <TableHead className="w-[120px]">Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.receivedAt).toLocaleString("en-GB", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{event.note || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.report.created}/{event.report.updated}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{event.items.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No receipts yet.</p>
        )}
      </div>
    </div>
  );
}
