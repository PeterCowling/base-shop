"use client";

/* eslint-disable react-hooks/exhaustive-deps, ds/no-arbitrary-tailwind -- COM-0001 [ttl=2026-12-31] product import UI pending DS refactor */

import type {
  ProductImportEvent,
  ProductImportReport,
} from "@platform-core/types/productImport";
import { getCsrfToken } from "@acme/shared-utils";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/atoms/shadcn";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import ProductImportResults from "./ProductImportResults";
import RecentProductImports from "./RecentProductImports";
import {
  createIdempotencyKey,
  exampleItemsJson,
  parseCsvToItems,
  parseItemsJson,
} from "./productImport.utils";

type ImportResult =
  | {
      ok: true;
      duplicate: boolean;
      committed: boolean;
      report: ProductImportReport;
      event: ProductImportEvent;
    }
  | { ok: false; code: string; message: string; details?: unknown };

export default function ProductImportClient({
  shop,
  recent,
}: {
  shop: string;
  recent: ProductImportEvent[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey());
  const [defaultStatus, setDefaultStatus] = useState("draft");
  const [note, setNote] = useState("");
  const [itemsJson, setItemsJson] = useState(() => exampleItemsJson());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewFingerprint, setPreviewFingerprint] = useState<string | null>(null);

  const fingerprint = useMemo(
    () => JSON.stringify({ idempotencyKey, defaultStatus, note: note.trim(), itemsJson }),
    [defaultStatus, idempotencyKey, itemsJson, note],
  );

  const canCommit = useMemo(() => {
    if (!result || !result.ok) return false;
    if (!result.report.dryRun) return false;
    if (result.report.errors !== 0) return false;
    return previewFingerprint === fingerprint;
  }, [fingerprint, previewFingerprint, result]);

  const startNewImport = useCallback(() => {
    setIdempotencyKey(createIdempotencyKey());
    setNote("");
    setDefaultStatus("draft");
    setResult(null);
    setError(null);
    setPreviewFingerprint(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    const text = await file.text();

    if (name.endsWith(".csv")) {
      const parsed = parseCsvToItems(text);
      if (parsed.ok === false) {
        setError(parsed.error);
        return;
      }
      setItemsJson(JSON.stringify(parsed.items, null, 2));
      return;
    }

    if (name.endsWith(".json") || file.type === "application/json") {
      const parsed = parseItemsJson(text);
      if (parsed.ok === false) {
        setError(parsed.error);
        return;
      }
      setItemsJson(JSON.stringify(parsed.items, null, 2));
      return;
    }

    setError("Unsupported file type. Upload .csv or .json.");
  }, []);

  const submit = useCallback(
    async (dryRun: boolean) => {
      setError(null);
      setBusy(true);
      try {
        const parsedItems = parseItemsJson(itemsJson);
        if (parsedItems.ok === false) {
          setError(parsedItems.error);
          return;
        }
        if (!parsedItems.items.length) {
          setError("Add at least one item.");
          return;
        }

        const csrf = getCsrfToken() ?? "";
        const res = await fetch(`/api/shop/${shop}/product-import`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrf,
          },
          body: JSON.stringify({
            idempotencyKey,
            dryRun,
            defaultStatus,
            ...(note.trim() ? { note: note.trim() } : {}),
            items: parsedItems.items,
          }),
        });

        const json = (await res.json().catch(() => null)) as ImportResult | null;
        if (!res.ok || !json) {
          setError("Request failed.");
          return;
        }
        if (json.ok === false) {
          setError(json.message || "Request failed.");
          setResult(json);
          setPreviewFingerprint(null);
          return;
        }

        setResult(json);
        if (dryRun) {
          setPreviewFingerprint(json.report.errors === 0 ? fingerprint : null);
        } else {
          setPreviewFingerprint(null);
        }
        if (!dryRun && json.committed) {
          router.refresh();
          setIdempotencyKey(createIdempotencyKey());
        }
      } finally {
        setBusy(false);
      }
    },
    [createIdempotencyKey, defaultStatus, fingerprint, idempotencyKey, itemsJson, note, router, shop],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Product import</h2>
          <p className="text-sm text-muted-foreground">
            Preview validates and reports changes. Commit writes products.json and appends an immutable import log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={startNewImport}
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
            className="h-10 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90 disabled:opacity-50"
            onClick={() => submit(false)}
            disabled={busy || !canCommit}
            title={!canCommit ? "Preview must succeed with zero errors before committing." : undefined}
          >
            Import products
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input
            label="Idempotency key"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            description="Submitting the same key twice returns the original import result instead of applying changes again."
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Default status</p>
              <Select value={defaultStatus} onValueChange={setDefaultStatus}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="review">review</SelectItem>
                  <SelectItem value="scheduled">scheduled</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="archived">archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Upload file</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,application/json,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void loadFile(file);
                }}
              />
            </div>
          </div>
          <Textarea
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Supplier, batch name, or context for this import…"
            className="min-h-[96px]"
          />
        </div>

        <div className="rounded-2xl border border-border/10 bg-surface-1 p-4">
          <h3 className="text-sm font-semibold">CSV columns</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Supported: <span className="font-medium text-foreground">sku</span>,{" "}
            <span className="font-medium text-foreground">title</span> or{" "}
            <span className="font-medium text-foreground">title_en</span>,{" "}
            <span className="font-medium text-foreground">description</span> or{" "}
            <span className="font-medium text-foreground">description_en</span>,{" "}
            <span className="font-medium text-foreground">price</span>,{" "}
            <span className="font-medium text-foreground">currency</span>,{" "}
            <span className="font-medium text-foreground">status</span>,{" "}
            <span className="font-medium text-foreground">media_urls</span>,{" "}
            <span className="font-medium text-foreground">publish_shops</span>.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            List fields accept <span className="font-medium text-foreground">|</span>,{" "}
            <span className="font-medium text-foreground">;</span>, or{" "}
            <span className="font-medium text-foreground">,</span> separators.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Items</h3>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl"
            onClick={() => setItemsJson(exampleItemsJson())}
            disabled={busy}
          >
            Reset example
          </Button>
        </div>
        <Textarea
          value={itemsJson}
          onChange={(e) => setItemsJson(e.target.value)}
          className="min-h-[240px] font-mono text-xs"
          aria-label="Items JSON"
        />
        {error && <p className="text-sm text-danger-foreground">{error}</p>}
      </div>

      {result?.ok && <ProductImportResults report={result.report} />}
      <RecentProductImports events={recent} />
    </div>
  );
}
