"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Card, CardContent, Input, Button } from "../atoms/shadcn";
import LocaleContentAccordion, { type LocalePanelConfig } from "./LocaleContentAccordion";
import type { Locale } from "@acme/i18n/locales";
import { LOCALES } from "@acme/i18n/locales";
import { useTranslations } from "@acme/i18n";

interface Props {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  /** Current locale for previewing key mode */
  locale?: Locale;
}

type Mode = "inline" | "key";

export default function LocalizedTextInput({ label, value = "", onChange, locale = "en" }: Props) {
  const [mode, setMode] = useState<Mode>("inline");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [enMessages, setEnMessages] = useState<Record<string, string>>({});
  const [localeMessages, setLocaleMessages] = useState<Record<string, string>>({});
  const t = useTranslations();

  // Load messages for key mode search/preview
  useEffect(() => {
    let mounted = true;
    (async () => {
      /* i18n-exempt -- ABC-123 dev-only dynamic i18n message import [ttl=2026-01-31] */
      const en = (await import("@acme/i18n/en.json")).default as Record<string, string>;
      if (!mounted) return;
      setEnMessages(en);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (locale === "en") {
        setLocaleMessages(enMessages);
        return;
      }
      try {
        const m = (await import(`@acme/i18n/${locale}.json`)).default as Record<string, string>;
        if (!mounted) return;
        setLocaleMessages(m);
      } catch {
        setLocaleMessages({});
      }
    })();
    return () => {
      mounted = false;
    };
  }, [locale, enMessages]);

  // Simple inline editor panels per locale (values other than EN are preview-only for now)
  const [inlineValues, setInlineValues] = useState<Partial<Record<Locale, string>>>({ en: value });
  useEffect(() => {
    setInlineValues((prev) => ({ ...prev, en: value }));
  }, [value]);

  const localePanels: LocalePanelConfig[] = useMemo(() => {
    const locales = LOCALES as readonly Locale[];
    return locales.map((loc) => ({
      locale: loc,
      trigger: <span className="text-sm font-medium uppercase tracking-wide">{loc}</span>,
      content: (
        <div className="space-y-2">
          <Input
            value={(inlineValues[loc] ?? (loc === "en" ? value : "")) as string}
            placeholder={t("cms.localizedText.textPlaceholder", { loc: loc.toUpperCase() }) as string}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const v = e.target.value;
              setInlineValues((prev) => ({ ...prev, [loc]: v }));
              if (loc === "en") onChange(v);
            }}
          />
        </div>
      ),
    }));
  }, [inlineValues, onChange, value, t]);

  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return Object.keys(enMessages).slice(0, 50);
    return Object.keys(enMessages).filter((k) => k.toLowerCase().includes(q)).slice(0, 50);
  }, [search, enMessages]);

  async function promoteToKey() {
    const enVal = (inlineValues.en ?? value ?? "").toString();
    const suggested = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, ".")
      .replace(/\.+/g, ".")
      .replace(/^\.|\.$/g, "");
    const key = window.prompt(
      t("cms.localizedText.enterKey") as string,
      suggested
    ) || "";
    if (!key) return;
    try {
      const res = await fetch("/cms/api/i18n/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enValue: enVal }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMode("key");
      setSearch(key);
      setSelectedKey(key);
      // ensure parent value is at least current EN value
      onChange(enVal);
      // refresh local message cache for preview
      setEnMessages((prev) => ({ ...prev, [key]: enVal }));
      if (locale !== "en") setLocaleMessages((prev) => ({ ...prev, [key]: enVal }));
    } catch {
      // no-op; optionally surface toast
    }
  }

  async function detachKey() {
    const key = selectedKey || search.trim();
    if (!key) return;
    try {
      const res = await fetch(`/cms/api/i18n/detach?key=${encodeURIComponent(key)}`);
      const json = (await res.json()) as { success: boolean; values?: Partial<Record<Locale, string>> };
      if (!json.success || !json.values) return;
      const vals = json.values;
      setInlineValues((prev) => ({ ...prev, ...vals }));
      if (typeof vals.en === "string") onChange(vals.en);
      setMode("inline");
    } catch {
      // no-op; optionally surface toast
    }
  }

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("inline")}
          className={`rounded border px-2 py-1 text-xs min-h-10 ${mode === "inline" ? "bg-accent" : "bg-muted"}`}
          aria-pressed={mode === "inline"}
        >
          {t("cms.localizedText.inline")}
        </button>
        <button
          type="button"
          onClick={() => setMode("key")}
          className={`rounded border px-2 py-1 text-xs min-h-10 ${mode === "key" ? "bg-accent" : "bg-muted"}`}
          aria-pressed={mode === "key"}
        >
          {t("cms.localizedText.sharedKey")}
        </button>
      </div>

      {mode === "inline" ? (
        <Card>
          <CardContent>
            <LocaleContentAccordion panels={localePanels} defaultOpenLocales={LOCALES as readonly Locale[]} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("cms.localizedText.promoteLabel")}</span>
              <Button type="button" size="sm" onClick={promoteToKey}>
                {t("cms.localizedText.promoteCta")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("cms.localizedText.searchKeys") as string}
          />
          <div className="max-h-48 overflow-auto rounded border">
            {filteredKeys.map((k) => (
              <button
                type="button"
                key={k}
                className="block w-full border-b px-2 py-1 text-start text-sm hover:bg-accent/30 min-h-10 min-w-10"
                onClick={() => {
                  const en = enMessages[k];
                  setSelectedKey(k);
                  if (typeof en === "string") onChange(en);
                }}
              >
                <div className="font-mono text-xs text-muted-foreground">{k}</div>
                <div className="text-sm">{enMessages[k]}</div>
                {locale !== "en" && (
                  <div className="text-xs text-muted-foreground">{localeMessages[k] ?? enMessages[k]}</div>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("cms.localizedText.detachLabel")}</span>
            <Button type="button" size="sm" disabled={!selectedKey && !search.trim()} onClick={detachKey}>
              {t("cms.localizedText.detachCta")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
