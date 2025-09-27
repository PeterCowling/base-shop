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
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
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

  const queueStatus = state.enabled ? t("Active") : t("Paused");

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
      setToast({ open: true, message: String(t("AI catalog crawl queued")) });
    } finally {
      setQuickActionBusy(false);
    }
  };

  const handlePreview = () => {
    setToast({ open: true, message: String(t("Catalog feed preview coming soon")) });
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">{t("AI Catalog Feed")}</h3>
              <p className="text-muted-foreground text-sm">
                {t(
                  "Configure the structured feed that powers AI discovery surfaces.",
                )}
              </p>
            </div>
            <div className="shrink-0 text-end text-sm">
              <p>
                {t("Last run:")}
                {" "}
                {state.lastCrawl
                  ? formatTimestamp(state.lastCrawl)
                  : t("No runs yet")}
              </p>
              <p className="mt-1 flex items-center gap-1 justify-end">
                {t("Queue status:")}{" "}
                <span className="font-semibold">{queueStatus}</span>
                <Tooltip text={t("Queue pauses when the feed is disabled.") as string}>
                  ?
                </Tooltip>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 text-sm font-medium">{t("Quick actions")}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleQueueCrawl}
                disabled={quickActionBusy || !state.enabled}
              >
                {quickActionBusy ? t("Queuing…") : t("Queue crawl")}
              </Button>
              <Button type="button" variant="outline" onClick={handlePreview}>
                {t("View feed")}
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
              <span className="text-sm font-medium">{t("Enable AI catalog feed")}</span>
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t("Fields")}</span>
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
              <span className="text-sm font-medium">{t("Page size")}</span>
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
              {saving ? t("Saving…") : t("Save settings")}
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
