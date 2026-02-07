"use client";

import { type FormEvent,useCallback, useEffect, useState } from "react";

import { Cluster, Stack } from "@acme/design-system/primitives";

import type { SupplierOption, SuppliersStrings,SupplierTerm } from "./types";

const DEFAULT_FORM = {
  supplierId: "",
  incoterms: "",
  paymentTerms: "",
  moq: "",
  currency: "USD",
  notes: "",
};

export default function SupplierTermsCard({
  suppliers,
  loading,
  strings,
  onAdded,
}: {
  suppliers: SupplierOption[];
  loading: boolean;
  strings: SuppliersStrings;
  onAdded: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [terms, setTerms] = useState<SupplierTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadTerms = useCallback(async (supplierId: string) => {
    if (!supplierId) {
      setTerms([]);
      return;
    }
    setTermsLoading(true);
    try {
      const response = await fetch(
        `/api/suppliers/${supplierId}/terms?limit=5`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        terms?: SupplierTerm[];
      };
      if (data.ok && Array.isArray(data.terms)) {
        setTerms(data.terms);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTermsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTerms(form.supplierId);
  }, [form.supplierId, loadTerms]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.supplierId) {
        setMessage(strings.messages.addTermError);
        return;
      }

      const moqParsed = Number.parseInt(form.moq, 10);
      const payload = {
        incoterms: form.incoterms.trim() || undefined,
        paymentTerms: form.paymentTerms.trim() || undefined,
        moq: Number.isFinite(moqParsed) ? moqParsed : undefined,
        currency: form.currency.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch(
          `/api/suppliers/${form.supplierId}/terms`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          setMessage(strings.messages.addTermError);
        } else {
          setMessage(strings.messages.addTermSuccess);
          setForm((current) => ({
            ...DEFAULT_FORM,
            supplierId: current.supplierId,
          }));
          await loadTerms(form.supplierId);
          await onAdded();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.addTermError);
      } finally {
        setSubmitting(false);
      }
    },
    [form, loadTerms, onAdded, strings.messages],
  );

  const disabled = loading || submitting;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.terms.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.terms.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.supplier}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.supplierId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                supplierId: event.target.value,
              }))
            }
            disabled={disabled}
          >
            <option value="">{strings.placeholders.selectSupplier}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.incoterms}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.incoterms}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                incoterms: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.paymentTerms}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.paymentTerms}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                paymentTerms: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.moq}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.moq}
            onChange={(event) =>
              setForm((current) => ({ ...current, moq: event.target.value }))
            }
            disabled={disabled}
            type="number"
            min={1}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.currency}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currency: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.notes}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {message ?? strings.notAvailable}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={disabled}
          >
            {strings.terms.action}
          </button>
        </Cluster>
      </form>

      <div className="mt-6 rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-sm">
        <div className="text-xs text-foreground/60">
          {strings.terms.historyLabel}
        </div>
        {termsLoading ? (
          <div className="mt-2 text-xs text-foreground/60">
            {strings.notAvailable}
          </div>
        ) : terms.length === 0 ? (
          <div className="mt-2 text-xs text-foreground/60">
            {strings.terms.historyEmpty}
          </div>
        ) : (
          <Stack gap={2} className="mt-2 text-xs text-foreground/70">
            {terms.map((term) => (
              <div key={term.id}>
                <span className="font-semibold">
                  {term.incoterms ?? strings.notAvailable}
                </span>{" "}
                • {term.paymentTerms ?? strings.notAvailable} •{" "}
                {term.currency ?? ""} {term.moq ?? strings.notAvailable}
                {term.notes ? ` • ${term.notes}` : ""}
              </div>
            ))}
          </Stack>
        )}
      </div>
    </section>
  );
}
