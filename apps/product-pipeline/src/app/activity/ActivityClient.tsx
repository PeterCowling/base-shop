"use client";

import { useCallback, useEffect, useState } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";

type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  details: unknown;
  createdAt: string | null;
};

type ActivityStrings = {
  label: string;
  title: string;
  table: {
    action: string;
    entity: string;
    when: string;
    details: string;
  };
  empty: string;
  loading: string;
};

function safeTimestamp(value: string | null): string {
  if (!value) return "-";
  return value;
}

function stringifyDetails(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ActivityClient({ strings }: { strings: ActivityStrings }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/activity?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as { ok?: boolean; entries?: AuditEntry[] };
      if (data.ok && Array.isArray(data.entries)) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
      </Stack>
      <Stack gap={3} className="mt-4 text-sm">
        {loading ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-foreground/60">
            {strings.loading}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-foreground/60">
            {strings.empty}
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
            >
              <Cluster justify="between" alignY="center" className="gap-4">
                <Stack gap={1}>
                  <span className="text-xs text-foreground/60">
                    {strings.table.action}: {entry.action}
                  </span>
                  <span className="text-sm font-semibold">
                    {strings.table.entity}: {entry.entityType} · {entry.entityId}
                  </span>
                </Stack>
                <span className="text-xs text-foreground/60">
                  {strings.table.when}: {safeTimestamp(entry.createdAt)}
                </span>
              </Cluster>
              <div className="mt-3">
                <div className="text-xs uppercase tracking-widest text-foreground/60">
                  {strings.table.details}
                </div>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-1 p-3 text-xs text-foreground/70">
                  {stringifyDetails(entry.details) || "-"}
                </pre>
              </div>
            </div>
          ))
        )}
      </Stack>
    </section>
  );
}
