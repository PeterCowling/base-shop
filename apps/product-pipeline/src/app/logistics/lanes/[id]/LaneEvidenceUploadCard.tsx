"use client";

import { type ChangeEvent, type FormEvent,useCallback, useState } from "react";
import { Cluster, Stack } from "@acme/design-system/primitives";

import type { LaneDetailStrings, LaneVersion } from "./types";

const DEFAULT_FORM = {
  laneVersionId: "",
  kind: "quote",
  file: null as File | null,
};

export default function LaneEvidenceUploadCard({
  versions,
  loading,
  strings,
  onUploaded,
}: {
  versions: LaneVersion[];
  loading: boolean;
  strings: LaneDetailStrings;
  onUploaded: () => Promise<void>;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setForm((current) => ({ ...current, file }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.laneVersionId || !form.file) {
        setMessage(strings.messages.uploadEvidenceError);
        return;
      }

      setSubmitting(true);
      setMessage(null);
      try {
        const formData = new FormData();
        formData.append("file", form.file);
        formData.append("laneVersionId", form.laneVersionId);
        formData.append("kind", form.kind.trim() || "quote");

        const uploadResponse = await fetch("/api/logistics/evidence/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          setMessage(strings.messages.uploadEvidenceError);
          setSubmitting(false);
          return;
        }

        const uploadData = (await uploadResponse.json()) as {
          ok?: boolean;
          uri?: string;
        };

        if (!uploadData.ok || !uploadData.uri) {
          setMessage(strings.messages.uploadEvidenceError);
          setSubmitting(false);
          return;
        }

        const evidenceResponse = await fetch(
          `/api/logistics/lane-versions/${form.laneVersionId}/evidence`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: form.kind.trim() || "quote",
              uri: uploadData.uri,
            }),
          },
        );

        if (!evidenceResponse.ok) {
          setMessage(strings.messages.uploadEvidenceError);
        } else {
          setMessage(strings.messages.uploadEvidenceSuccess);
          setForm(DEFAULT_FORM);
          await onUploaded();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.messages.uploadEvidenceError);
      } finally {
        setSubmitting(false);
      }
    },
    [form, onUploaded, strings.messages],
  );

  const disabled = loading || submitting;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.evidence.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.evidence.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.evidenceKind}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.kind}
            onChange={(event) =>
              setForm((current) => ({ ...current, kind: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.evidenceFile}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm file:me-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary"
            onChange={handleFileChange}
            disabled={disabled}
            type="file"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.fields.versionLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.laneVersionId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                laneVersionId: event.target.value,
              }))
            }
            disabled={disabled}
          >
            <option value="">{strings.placeholders.selectVersion}</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionLabel ??
                  `${version.confidence ?? ""} ${version.createdAt ?? ""}`.trim()}
              </option>
            ))}
          </select>
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
            {strings.evidence.action}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
