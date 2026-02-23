// src/components/till/ReconciliationWorkbench.tsx
"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Input } from "@acme/design-system";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { TillDataProvider, useTillData } from "../../context/TillDataContext";
import usePmsPostings from "../../hooks/data/till/usePmsPostings";
import useTerminalBatches from "../../hooks/data/till/useTerminalBatches";
import { usePmsPostingsMutations } from "../../hooks/mutations/usePmsPostingsMutations";
import { useTerminalBatchesMutations } from "../../hooks/mutations/useTerminalBatchesMutations";
import { type CashCount } from "../../types/hooks/data/cashCountData";
import { showToast } from "../../utils/toastUtils";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const format = (value: number): string => `€${value.toFixed(2)}`;

const diffClass = (value: number): string =>
  Math.abs(value) < 0.01 ? "text-success-main" : "text-error-main";

/* -------------------------------------------------------------------------- */
/* Inline entry form                                                          */
/* -------------------------------------------------------------------------- */

interface PmsPostingFormProps {
  onSubmit: (amount: number, method: "CASH" | "CC", note?: string) => Promise<void>;
}

const PmsPostingForm = memo(function PmsPostingForm({ onSubmit }: PmsPostingFormProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "CC">("CASH");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Amount must be greater than zero", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsed, method, note || undefined);
      setAmount("");
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }, [amount, method, note, onSubmit]);

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div>
        <label className="block text-xs mb-1">Amount</label>
        <Input
          compatibilityMode="no-wrapper"
          type="number"
          inputMode="decimal"
          className="w-28 rounded border px-2 py-1 text-sm"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
        />
      </div>
      <div>
        <label className="block text-xs mb-1">Method</label>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value as "CASH" | "CC")}
          disabled={submitting}
        >
          <option value="CASH">Cash</option>
          <option value="CC">CC</option>
        </select>
      </div>
      <div>
        <label className="block text-xs mb-1">Note</label>
        <Input
          compatibilityMode="no-wrapper"
          type="text"
          className="w-40 rounded border px-2 py-1 text-sm"
          placeholder="Optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded bg-primary-main px-3 py-1 text-sm text-primary-fg hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Add PMS Posting"}
      </Button>
    </div>
  );
});

interface TerminalBatchFormProps {
  onSubmit: (amount: number, note?: string) => Promise<void>;
}

const TerminalBatchForm = memo(function TerminalBatchForm({ onSubmit }: TerminalBatchFormProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Amount must be greater than zero", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsed, note || undefined);
      setAmount("");
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }, [amount, note, onSubmit]);

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div>
        <label className="block text-xs mb-1">Amount</label>
        <Input
          compatibilityMode="no-wrapper"
          type="number"
          inputMode="decimal"
          className="w-28 rounded border px-2 py-1 text-sm"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
        />
      </div>
      <div>
        <label className="block text-xs mb-1">Note</label>
        <Input
          compatibilityMode="no-wrapper"
          type="text"
          className="w-40 rounded border px-2 py-1 text-sm"
          placeholder="Optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded bg-primary-main px-3 py-1 text-sm text-primary-fg hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Add Terminal Batch"}
      </Button>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const ReconciliationWorkbenchContent = memo(
  function ReconciliationWorkbenchContent() {
    const { transactions, cashCounts } = useTillData();
    const { postings, loading: pmsLoading } = usePmsPostings();
    const { batches, loading: batchLoading } = useTerminalBatches();
    const { addPmsPosting } = usePmsPostingsMutations();
    const { addTerminalBatch } = useTerminalBatchesMutations();

    /* ------------------------------- POS totals ------------------------------ */
    const posCashTotal = useMemo(
      () =>
        transactions
          .filter((t) => t.method === "CASH")
          .reduce((sum, t) => sum + t.amount, 0),
      [transactions]
    );

    const posCcTotal = useMemo(
      () =>
        transactions
          .filter((t) => t.method === "CC")
          .reduce((sum, t) => sum + t.amount, 0),
      [transactions]
    );

    /* ----------------------------- Cash drawer ------------------------------ */
    const lastCashCount = useMemo<CashCount | null>(() => {
      if (cashCounts.length === 0) return null;
      return cashCounts[cashCounts.length - 1];
    }, [cashCounts]);

    const drawerTotal = lastCashCount?.count ?? 0;

    /* ----------------------------- PMS postings ----------------------------- */
    const pmsCashTotal = useMemo(
      () =>
        postings
          .filter((p) => p.method === "CASH")
          .reduce((sum, p) => sum + p.amount, 0),
      [postings]
    );

    const pmsCcTotal = useMemo(
      () =>
        postings
          .filter((p) => p.method === "CC")
          .reduce((sum, p) => sum + p.amount, 0),
      [postings]
    );

    /* --------------------------- Terminal batches --------------------------- */
    const terminalTotal = useMemo(
      () => batches.reduce((sum, b) => sum + b.amount, 0),
      [batches]
    );

    const numberSchema = z.number().nonnegative();
    const posCashParse = numberSchema.safeParse(posCashTotal);
    const posCcParse = numberSchema.safeParse(posCcTotal);
    const drawerParse = numberSchema.safeParse(drawerTotal);
    const pmsCashParse = numberSchema.safeParse(pmsCashTotal);
    const pmsCcParse = numberSchema.safeParse(pmsCcTotal);
    const terminalParse = numberSchema.safeParse(terminalTotal);

    const hasParseError = [
      posCashParse,
      posCcParse,
      drawerParse,
      pmsCashParse,
      pmsCcParse,
      terminalParse,
    ].some((r) => !r.success);

    useEffect(() => {
      if (hasParseError) {
        showToast("Invalid reconciliation data", "error");
      }
    }, [hasParseError]);

    const safePosCashTotal = posCashParse.success ? posCashParse.data : 0;
    const safePosCcTotal = posCcParse.success ? posCcParse.data : 0;
    const safeDrawerTotal = drawerParse.success ? drawerParse.data : 0;
    const safePmsCashTotal = pmsCashParse.success ? pmsCashParse.data : 0;
    const safePmsCcTotal = pmsCcParse.success ? pmsCcParse.data : 0;
    const safeTerminalTotal = terminalParse.success ? terminalParse.data : 0;

    /* ----------------------- Missing data warnings ------------------------- */
    const hasPmsData = !pmsLoading && postings.length > 0;
    const hasBatchData = !batchLoading && batches.length > 0;

    /* --------------------------------- UI ---------------------------------- */
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-2xl font-semibold">Reconciliation Workbench</h2>
        {hasParseError && (
          <p className="text-sm text-warning-main">
            Some values could not be parsed.
          </p>
        )}

        {!pmsLoading && !hasPmsData && (
          <p className="text-sm text-warning-main" data-cy="pms-missing-warning">
            No PMS postings entered for today. Add entries below.
          </p>
        )}
        {!batchLoading && !hasBatchData && (
          <p className="text-sm text-warning-main" data-cy="batch-missing-warning">
            No terminal batch entered for today. Add an entry below.
          </p>
        )}

        <Table className="w-full border-collapse text-sm">
          <TableHeader className="bg-surface-2">
            <TableRow>
              <TableHead className="p-2 text-start border">Source</TableHead>
              <TableHead className="p-2 text-end border">Cash</TableHead>
              <TableHead className="p-2 text-end border">CC</TableHead>
              <TableHead className="p-2 text-end border">Cash Δ</TableHead>
              <TableHead className="p-2 text-end border">CC Δ</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* POS Totals */}
            <TableRow className="border-b">
              <TableCell className="p-2">POS Totals</TableCell>
              <TableCell className="p-2 text-end">{format(safePosCashTotal)}</TableCell>
              <TableCell className="p-2 text-end">{format(safePosCcTotal)}</TableCell>
              <TableCell className="p-2" />
              <TableCell className="p-2" />
            </TableRow>

            {/* Cash Drawer */}
            <TableRow className="border-b">
              <TableCell className="p-2">Cash Drawer</TableCell>
              <TableCell
                className={`p-2 text-right ${diffClass(
                  safeDrawerTotal - safePosCashTotal
                )}`}
              >
                {format(safeDrawerTotal)}
              </TableCell>
              <TableCell className="p-2 text-end text-muted-foreground">-</TableCell>
              <TableCell
                className={`p-2 text-right ${diffClass(
                  safeDrawerTotal - safePosCashTotal
                )}`}
              >
                {format(safeDrawerTotal - safePosCashTotal)}
              </TableCell>
              <TableCell className="p-2" />
            </TableRow>

            {/* PMS Postings */}
            <TableRow className="border-b">
              <TableCell className="p-2">PMS Postings</TableCell>
              <TableCell className="p-2 text-end">{format(safePmsCashTotal)}</TableCell>
              <TableCell className="p-2 text-end">{format(safePmsCcTotal)}</TableCell>
              <TableCell
                className={`p-2 text-right ${diffClass(
                  safePmsCashTotal - safePosCashTotal
                )}`}
              >
                {format(safePmsCashTotal - safePosCashTotal)}
              </TableCell>
              <TableCell
                className={`p-2 text-right ${diffClass(
                  safePmsCcTotal - safePosCcTotal
                )}`}
              >
                {format(safePmsCcTotal - safePosCcTotal)}
              </TableCell>
            </TableRow>

            {/* Terminal Batch */}
            <TableRow>
              <TableCell className="p-2">Terminal Batch</TableCell>
              <TableCell className="p-2 text-end text-muted-foreground">-</TableCell>
              <TableCell className="p-2 text-end">{format(safeTerminalTotal)}</TableCell>
              <TableCell className="p-2" />
              <TableCell
                className={`p-2 text-right ${diffClass(
                  safeTerminalTotal - safePosCcTotal
                )}`}
              >
                {format(safeTerminalTotal - safePosCcTotal)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Entry forms */}
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-sm font-semibold mb-2">Add PMS Posting</h3>
            <PmsPostingForm onSubmit={addPmsPosting} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Add Terminal Batch</h3>
            <TerminalBatchForm onSubmit={addTerminalBatch} />
          </div>
        </div>
      </div>
    );
  }
);

const ReconciliationWorkbench = () => (
  <TillDataProvider>
    <ReconciliationWorkbenchContent />
  </TillDataProvider>
);

export default ReconciliationWorkbench;
