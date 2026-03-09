/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useMemo, useRef, useState } from "react";

import { HISTORY_DISPLAY_LIMIT } from "../../lib/inventory-utils";

type RowResult = {
  row: number;
  status: "ok" | "error";
  sku?: string;
  error?: string;
};

type ImportResult = {
  ok: boolean;
  dryRun?: boolean;
  totalRows?: number;
  validRows?: number;
  importedRows?: number;
  errorRows?: number;
  error?: string;
  results?: RowResult[];
};

type InventoryImportProps = {
  shop: string | null;
  onImportComplete?: () => void;
};

type DropZoneProps = {
  shop: string | null;
  file: File | null;
  dragging: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
  onDragChange: (v: boolean) => void;
};

function DropZone({ shop, file, dragging, fileRef, onFile, onDragChange }: DropZoneProps) {
  return (
    <button
      type="button"
      aria-label="Upload inventory file"
      disabled={!shop}
      className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center transition ${
        dragging ? "border-gate-accent bg-gate-accent/5" : "border-gate-border hover:border-gate-accent/50"
      } ${!shop ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      onDragOver={(e) => { e.preventDefault(); if (shop) onDragChange(true); }}
      onDragLeave={() => onDragChange(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDragChange(false);
        if (!shop) return;
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        className="sr-only"
        disabled={!shop}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {file ? (
        <span className="text-xs text-gate-ink">{file.name}</span>
      ) : (
        <span className="text-xs text-gate-muted">
          {shop ? "Drop CSV/JSON or click to browse" : "Select a shop first"}
        </span>
      )}
    </button>
  );
}

type ImportActionsProps = {
  loading: boolean;
  shop: string | null;
  onValidate: () => void;
  onImport: () => void;
  onClear: () => void;
};

function ImportActions({ loading, shop, onValidate, onImport, onClear }: ImportActionsProps) {
  const disabled = loading || !shop;
  return (
     
    <div className="flex gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onValidate}
         
        className="rounded px-3 py-1.5 text-xs font-medium focus-visible:ring-1 focus-visible:ring-gate-border hover:bg-gate-surface disabled:opacity-50"
      >
        {loading ? "…" : "Validate"}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onImport}
         
        className="rounded bg-gate-accent px-3 py-1.5 text-xs font-medium text-gate-on-accent hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "…" : "Import"}
      </button>
      <button
        type="button"
        onClick={onClear}
         
        className="ms-auto text-xs text-gate-muted hover:text-gate-ink"
      >
        Clear
      </button>
    </div>
  );
}

type ImportResultPanelProps = { result: ImportResult };

function ImportResultPanel({ result }: ImportResultPanelProps) {
  const [errorRows, okRows] = useMemo(() => {
    const errs: RowResult[] = [];
    const oks: RowResult[] = [];
    for (const r of result.results ?? []) {
      if (r.status === "error") errs.push(r);
      else oks.push(r);
    }
    return [errs, oks];
  }, [result.results]);

  return (
     
    <div className={`rounded-lg p-3 text-xs ${result.ok ? "bg-success-surface text-success-fg" : "bg-danger-surface text-danger-fg"}`}>
      {result.ok ? (
        <>
          <p className="font-medium">
            {result.dryRun ? "Validation passed" : "Import complete"}
            {" — "}
            {result.dryRun ? result.validRows : result.importedRows}/{result.totalRows} rows
          </p>
          {result.errorRows && result.errorRows > 0 ? (
            <p>{result.errorRows} row(s) with errors</p>
          ) : null}
        </>
      ) : (
        <p className="font-medium">{result.error ?? "Import failed"}</p>
      )}

      {errorRows.length > 0 && (
         
        <ul className="mt-2 space-y-0.5">
          {errorRows.slice(0, HISTORY_DISPLAY_LIMIT).map((r) => (
            <li key={r.row}>Row {r.row}{r.sku ? ` (${r.sku})` : ""}: {r.error}</li>
          ))}
          {errorRows.length > HISTORY_DISPLAY_LIMIT && <li>…and {errorRows.length - HISTORY_DISPLAY_LIMIT} more</li>}
        </ul>
      )}

      {result.ok && okRows.length > 0 && (
        <p className="mt-1 text-gate-muted">
          {okRows.map((r) => r.sku).filter(Boolean).slice(0, 5).join(", ")}
          {okRows.length > 5 ? ` +${okRows.length - 5} more` : ""}
        </p>
      )}
    </div>
  );
}

export function InventoryImport({ shop, onImportComplete }: InventoryImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setResult(null);
  }

  async function runImport(dryRun: boolean) {
    if (!shop || !file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const url = `/api/inventory/${encodeURIComponent(shop)}/import${dryRun ? "?dryRun=true" : ""}`;
      const resp = await fetch(url, { method: "POST", body: form });
      const data = (await resp.json()) as ImportResult;
      setResult(data);
      if (data.ok && !dryRun) onImportComplete?.();
    } catch {
      setResult({ ok: false, error: "Network error — import failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
     
    <div className="mt-4 space-y-3 border-t border-gate-border pt-3">
      <p className="text-xs font-medium text-gate-ink">Import inventory (CSV or JSON)</p>

      <DropZone
        shop={shop}
        file={file}
        dragging={dragging}
        fileRef={fileRef}
        onFile={handleFile}
        onDragChange={setDragging}
      />

      {file && (
        <ImportActions
          loading={loading}
          shop={shop}
          onValidate={() => void runImport(true)}
          onImport={() => void runImport(false)}
          onClear={() => { setFile(null); setResult(null); }}
        />
      )}

      {result && <ImportResultPanel result={result} />}
    </div>
  );
}
