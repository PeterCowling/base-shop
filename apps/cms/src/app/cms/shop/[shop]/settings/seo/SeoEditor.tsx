"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";

import { Toast, Tooltip } from "@/components/atoms";
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
} from "@/components/atoms/shadcn";
import { setFreezeTranslations, updateSeo } from "@cms/actions/shops.server";
import type { Locale } from "@acme/types";

interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  alt?: string;
  canonicalBase?: string;
  ogUrl?: string;
  twitterCard?: string;
}

interface Props {
  shop: string;
  languages: readonly Locale[];
  initialSeo: Partial<Record<string, SeoData>>;
  initialFreeze?: boolean;
}

type SharedField =
  | "title"
  | "description"
  | "image"
  | "alt"
  | "ogUrl"
  | "twitterCard";

const SHARED_FIELDS: readonly SharedField[] = [
  "title",
  "description",
  "image",
  "alt",
  "ogUrl",
  "twitterCard",
];

const SHARED_SET = new Set<SharedField>(SHARED_FIELDS);

const EMPTY_DRAFT: SeoData = {
  title: "",
  description: "",
  image: "",
  alt: "",
  canonicalBase: "",
  ogUrl: "",
  twitterCard: "",
};

const pickShared = (data: SeoData | undefined) => ({
  title: data?.title ?? "",
  description: data?.description ?? "",
  image: data?.image ?? "",
  alt: data?.alt ?? "",
  ogUrl: data?.ogUrl ?? "",
  twitterCard: data?.twitterCard ?? "",
});

const buildDraft = (
  locale: Locale,
  initial: Partial<Record<string, SeoData>>,
): SeoData => ({
  ...EMPTY_DRAFT,
  ...initial[locale],
});

type TabsProps = {
  value: Locale;
  onValueChange(locale: Locale): void;
  items: { value: Locale; label: string }[];
};

function Tabs({ value, onValueChange, items }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
            onClick={() => onValueChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SeoEditor({
  shop,
  languages,
  initialSeo,
  initialFreeze = false,
}: Props) {
  const initialDrafts = useMemo(
    () =>
      languages.reduce((acc, lang) => {
        acc[lang] = buildDraft(lang, initialSeo);
        return acc;
      }, {} as Record<Locale, SeoData>),
    [initialSeo, languages],
  );

  const [locale, setLocale] = useState<Locale>(languages[0]);
  const [drafts, setDrafts] = useState<Record<Locale, SeoData>>(
    () => initialDrafts,
  );
  const [shared, setShared] = useState(() => pickShared(initialDrafts[languages[0]]));
  const [freeze, setFreeze] = useState(initialFreeze);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" },
  );

  const currentDraft = drafts[locale] ?? buildDraft(locale, initialSeo);

  const showToast = useCallback((message: string) => {
    setToast({ open: true, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  const updateField = useCallback(
    (field: keyof SeoData, value: string) => {
      setDrafts((prev) => {
        const next = { ...prev };
        if (freeze && SHARED_SET.has(field as SharedField)) {
          languages.forEach((lang) => {
            const base = next[lang] ?? buildDraft(lang, initialSeo);
            next[lang] = { ...base, [field]: value };
          });
        } else {
          const base = next[locale] ?? buildDraft(locale, initialSeo);
          next[locale] = { ...base, [field]: value };
        }
        return next;
      });
      if (SHARED_SET.has(field as SharedField)) {
        setShared((prev) => ({ ...prev, [field]: value }));
      }
    },
    [freeze, initialSeo, languages, locale],
  );

  const handleLocaleChange = useCallback(
    (nextLocale: Locale) => {
      setLocale(nextLocale);
      if (freeze) {
        setDrafts((prev) => {
          const next = { ...prev };
          const base = next[nextLocale] ?? buildDraft(nextLocale, initialSeo);
          next[nextLocale] = { ...base, ...shared };
          return next;
        });
      }
      setErrors({});
      setWarnings([]);
    },
    [freeze, initialSeo, shared],
  );

  const handleFreezeChange = useCallback(
    async (checked: boolean) => {
      setFreeze(checked);
      await setFreezeTranslations(shop, checked);
      if (checked) {
        const sharedValues = pickShared(currentDraft);
        setShared(sharedValues);
        setDrafts((prev) => {
          const next = { ...prev };
          languages.forEach((lang) => {
            const base = next[lang] ?? buildDraft(lang, initialSeo);
            next[lang] = { ...base, ...sharedValues };
          });
          return next;
        });
      }
    },
    [currentDraft, initialSeo, languages, shop],
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("title", currentDraft.title ?? "");
    fd.append("description", currentDraft.description ?? "");
    fd.append("image", currentDraft.image ?? "");
    fd.append("alt", currentDraft.alt ?? "");
    fd.append("canonicalBase", currentDraft.canonicalBase ?? "");
    fd.append("ogUrl", currentDraft.ogUrl ?? "");
    fd.append("twitterCard", currentDraft.twitterCard ?? "");

    try {
      const result = await updateSeo(shop, fd);
      if (result.errors) {
        setErrors(result.errors);
        setWarnings([]);
        showToast("Unable to save metadata");
      } else {
        setErrors({});
        const warningList = result.warnings ?? [];
        setWarnings(warningList);
        showToast(
          warningList.length > 0
            ? "Metadata saved with warnings"
            : "Metadata saved",
        );
      }
    } catch {
      showToast("Unable to save metadata");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          id: `${shop}-${locale}`,
          title: currentDraft.title,
          description: currentDraft.description,
        }),
      });

      if (!res.ok) {
        showToast("Unable to generate metadata");
        return;
      }

      const data = (await res.json()) as {
        title: string;
        description: string;
        alt: string;
        image: string;
      };
      updateField("title", data.title);
      updateField("description", data.description);
      updateField("alt", data.alt);
      updateField("image", data.image);
      showToast("AI metadata generated");
    } catch {
      showToast("Unable to generate metadata");
    } finally {
      setGenerating(false);
    }
  }, [currentDraft.description, currentDraft.title, locale, shop, showToast, updateField]);

  const errorFor = useCallback(
    (field: keyof SeoData) => errors[field]?.join("; ") ?? "",
    [errors],
  );

  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">SEO metadata</h3>
              <p className="text-muted-foreground text-sm">
                Manage localized titles, descriptions, and social previews.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={freeze}
                onChange={(event) => handleFreezeChange(event.target.checked)}
              />
              <span>Freeze translations</span>
              <Tooltip text="Apply the same metadata across all locales.">?</Tooltip>
            </label>
          </div>

          <Tabs
            value={locale}
            onValueChange={handleLocaleChange}
            items={languages.map((l) => ({ value: l, label: l.toUpperCase() }))}
          />

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Title</span>
                <Input
                  value={currentDraft.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
                {errorFor("title") && (
                  <span className="text-xs text-destructive">{errorFor("title")}</span>
                )}
              </label>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Description</span>
                <Textarea
                  rows={3}
                  value={currentDraft.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
                {errorFor("description") && (
                  <span className="text-xs text-destructive">
                    {errorFor("description")}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Image URL</span>
                <Input
                  value={currentDraft.image}
                  onChange={(e) => updateField("image", e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Image Alt Text</span>
                <Input
                  value={currentDraft.alt}
                  onChange={(e) => updateField("alt", e.target.value)}
                />
              </label>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="text-sm font-medium text-primary"
                aria-expanded={showAdvanced}
                onClick={() => setShowAdvanced((open) => !open)}
              >
                {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
              </button>
              {showAdvanced && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      Canonical Base
                      <Tooltip text="Base URL used to build canonical links.">?</Tooltip>
                    </span>
                    <Input
                      value={currentDraft.canonicalBase}
                      onChange={(e) => updateField("canonicalBase", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Open Graph URL</span>
                    <Input
                      value={currentDraft.ogUrl}
                      onChange={(e) => updateField("ogUrl", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Twitter Card</span>
                    <Input
                      value={currentDraft.twitterCard}
                      onChange={(e) => updateField("twitterCard", e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-800">
                <p className="font-medium">Warnings</p>
                <ul className="list-disc pl-5">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? "Generating…" : "Generate with AI"}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                All changes apply to locale {locale.toUpperCase()} unless translations are frozen.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
    </>
  );
}
