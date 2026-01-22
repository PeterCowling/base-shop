"use client";

import { Grid, Stack } from "@acme/design-system/primitives";

import type { SuppliersStrings,SupplierSummary } from "./types";

function formatDate(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed).toLocaleDateString("en-GB");
}

export default function SuppliersList({
  suppliers,
  loading,
  strings,
}: {
  suppliers: SupplierSummary[];
  loading: boolean;
  strings: SuppliersStrings;
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.list.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.list.title}
        </h2>
      </Stack>
      <Stack gap={4} className="mt-6">
        {loading ? (
          <div className="rounded-3xl border border-border-1 bg-surface-2 p-4">
            <div className="h-4 w-32 rounded-full bg-foreground/10" />
            <div className="mt-3 h-5 w-48 rounded-full bg-foreground/10" />
            <div className="mt-4 h-3 w-40 rounded-full bg-foreground/10" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-sm text-foreground/70">
            {strings.list.empty}
          </div>
        ) : (
          suppliers.map((supplier) => {
            const contact = supplier.contact ?? null;
            const latestTerm = supplier.latestTerm;
            return (
              <div
                key={supplier.id}
                className="rounded-3xl border border-border-1 bg-surface-2 p-4"
              >
                <div className="text-xs text-foreground/60">{supplier.id}</div>
                <div className="text-lg font-semibold">{supplier.name}</div>
                <Grid cols={1} gap={3} className="mt-3 md:grid-cols-2">
                  <div className="text-sm text-foreground/70">
                    {strings.fields.status}:{" "}
                    {supplier.status ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.country}:{" "}
                    {supplier.country ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.termCount}: {supplier.termCount}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.contactName}:{" "}
                    {contact?.["name"] ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.contactEmail}:{" "}
                    {contact?.["email"] ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.contactChannel}:{" "}
                    {contact?.["channel"] ?? strings.notAvailable}
                  </div>
                </Grid>
                <div className="mt-4 rounded-2xl border border-border-1 bg-surface-1 px-4 py-3 text-xs">
                  <div className="text-xs text-foreground/60">
                    {strings.terms.historyLabel}
                  </div>
                  {latestTerm ? (
                    <Grid cols={1} gap={2} className="mt-2 md:grid-cols-2">
                      <div className="text-foreground/70">
                        {strings.fields.incoterms}:{" "}
                        {latestTerm.incoterms ?? strings.notAvailable}
                      </div>
                      <div className="text-foreground/70">
                        {strings.fields.paymentTerms}:{" "}
                        {latestTerm.paymentTerms ?? strings.notAvailable}
                      </div>
                      <div className="text-foreground/70">
                        {strings.fields.moq}:{" "}
                        {latestTerm.moq ?? strings.notAvailable}
                      </div>
                      <div className="text-foreground/70">
                        {strings.fields.currency}:{" "}
                        {latestTerm.currency ?? strings.notAvailable}
                      </div>
                      <div className="text-foreground/70 md:col-span-2">
                        {strings.fields.notes}:{" "}
                        {latestTerm.notes ?? strings.notAvailable}
                      </div>
                      <div className="text-foreground/70 md:col-span-2">
                        {strings.fields.createdAt}:{" "}
                        {formatDate(
                          latestTerm.createdAt ?? null,
                          strings.notAvailable,
                        )}
                      </div>
                    </Grid>
                  ) : (
                    <div className="mt-2 text-xs text-foreground/60">
                      {strings.terms.historyEmpty}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Stack>
    </section>
  );
}
