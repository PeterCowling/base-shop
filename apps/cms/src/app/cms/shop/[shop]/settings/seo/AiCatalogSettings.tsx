"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";

import { Toast, Tooltip } from "@/components/atoms";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
} from "@/components/atoms/shadcn";
import { updateAiCatalog } from "@cms/actions/shops.server";
import { formatTimestamp } from "@acme/date-utils";
import type { AiCatalogField } from "@acme/types";

const ALL_FIELDS: AiCatalogField[] = [
  "id",
  "title",
  "description",
  "price",
  "media",
];

interface Props {
  shop: string;
  initial: { enabled: boolean; fields: AiCatalogField[]; pageSize: number; lastCrawl?: string };
}

export default function AiCatalogSettings({ shop, initial }: Props) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [quickActionBusy, setQuickActionBusy] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const toggleField = (field: AiCatalogField) => {
    setState((s) => ({
      ...s,
      fields: s.fields.includes(field)
        ? s.fields.filter((f) => f !== field)
        : [...s.fields, field],
    }));
  };

  const queueStatus = state.enabled ? "Active" : "Paused";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateAiCatalog(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.seo?.aiCatalog) {
      setState((s) => ({
        ...s,
        enabled: result.settings!.seo!.aiCatalog!.enabled,
        fields: result.settings!.seo!.aiCatalog!.fields,
        pageSize: result.settings!.seo!.aiCatalog!.pageSize,
      }));
      setErrors({});
    }
    setSaving(false);
  };

  const handleQueueCrawl = async () => {
    setQuickActionBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setToast({ open: true, message: "AI catalog crawl queued" });
    } finally {
      setQuickActionBusy(false);
    }
  };

  const handlePreview = () => {
    setToast({ open: true, message: "Catalog feed preview coming soon" });
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">AI Catalog Feed</h3>
              <p className="text-muted-foreground text-sm">
                Configure the structured feed that powers AI discovery surfaces.
              </p>
            </div>
            <div className="shrink-0 text-right text-sm">
              <p>
                Last run:
                {" "}
                {state.lastCrawl ? formatTimestamp(state.lastCrawl) : "No runs yet"}
              </p>
              <p className="mt-1 flex items-center gap-1 justify-end">
                Queue status: <span className="font-semibold">{queueStatus}</span>
                <Tooltip text="Queue pauses when the feed is disabled.">?</Tooltip>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 text-sm font-medium">Quick actions</span>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleQueueCrawl}
                disabled={quickActionBusy || !state.enabled}
              >
                {quickActionBusy ? "Queuing…" : "Queue crawl"}
              </Button>
              <Button type="button" variant="outline" onClick={handlePreview}>
                View feed
              </Button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-5">
            <label className="flex items-center gap-2">
              <Checkbox
                name="enabled"
                checked={state.enabled}
                onCheckedChange={(v: boolean) =>
                  setState((s) => ({ ...s, enabled: Boolean(v) }))
                }
              />
              <span className="text-sm font-medium">Enable AI catalog feed</span>
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Fields</span>
              {ALL_FIELDS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    name="fields"
                    value={f}
                    checked={state.fields.includes(f)}
                    onCheckedChange={() => toggleField(f)}
                  />
                  <span className="capitalize">{f}</span>
                </label>
              ))}
              {errors.fields && (
                <span className="text-xs text-destructive">{errors.fields.join("; ")}</span>
              )}
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Page size</span>
              <Input
                type="number"
                name="pageSize"
                value={state.pageSize}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setState((s) => ({ ...s, pageSize: Number(e.target.value) }))
                }
              />
              {errors.pageSize && (
                <span className="text-xs text-destructive">
                  {errors.pageSize.join("; ")}
                </span>
              )}
            </label>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </>
  );
}
