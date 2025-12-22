"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import type { SuppliersStrings } from "./types";

const DEFAULT_FORM = {
  name: "",
  status: "",
  country: "",
  contactName: "",
  contactEmail: "",
  contactChannel: "",
};

export default function SupplierCreateCard({
  loading,
  strings,
  onCreated,
}: {
  loading: boolean;
  strings: SuppliersStrings;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = form.name.trim();
      if (!name) {
        setMessage(strings.messages.createError);
        return;
      }

      const contact: Record<string, string> = {};
      if (form.contactName.trim())
        contact["name"] = form.contactName.trim();
      if (form.contactEmail.trim())
        contact["email"] = form.contactEmail.trim();
      if (form.contactChannel.trim())
        contact["channel"] = form.contactChannel.trim();

      setSubmitting(true);
      setMessage(null);
      try {
        const response = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            status: form.status.trim() || undefined,
            country: form.country.trim() || undefined,
            contact: Object.keys(contact).length > 0 ? contact : undefined,
          }),
        });
        if (!response.ok) {
          setMessage(strings.messages.createError);
        } else {
          setMessage(strings.messages.createSuccess);
          setForm(DEFAULT_FORM);
          await onCreated();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.createError);
      } finally {
        setSubmitting(false);
      }
    },
    [form, onCreated, strings.messages],
  );

  const disabled = loading || submitting;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.create.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.create.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.name}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.status}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.country}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.country}
            onChange={(event) =>
              setForm((current) => ({ ...current, country: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.contactName}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.contactName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contactName: event.target.value,
              }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fields.contactEmail}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.contactEmail}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contactEmail: event.target.value,
              }))
            }
            disabled={disabled}
            type="email"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.contactChannel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.contactChannel}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contactChannel: event.target.value,
              }))
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
            {strings.create.action}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
