"use client";

import { type FormEvent, useState } from "react";
import clsx from "clsx";

import { Tag } from "@acme/design-system/atoms/Tag";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/types";

import { Alert, Toast } from "@/components/atoms";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";

import { SeoAdvancedSettings } from "./SeoAdvancedSettings";
import { SeoEditorHeader } from "./SeoEditorHeader";
import { SeoSharedFields } from "./SeoSharedFields";
import { useSeoEditor, type UseSeoEditorProps } from "./useSeoEditor";

const Tabs = ({
  value,
  onValueChange,
  items,
}: {
  value: Locale;
  onValueChange(locale: Locale): void;
  items: { value: Locale; label: string }[];
}) => {
  return (
    <Inline wrap gap={2} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={clsx(
              "rounded-full",
              "border",
              "px-3",
              "py-1",
              "text-sm",
              "font-medium",
              "transition-colors",
              active
                ? [
                    "border-primary",
                    "bg-primary",
                    "text-primary-foreground",
                  ]
                : [
                    "border-transparent",
                    "bg-muted",
                    "text-muted-foreground",
                    "hover:bg-muted/70",
                  ],
            )}
            onClick={() => onValueChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </Inline>
  );
};

export default function SeoEditor(props: UseSeoEditorProps) {
  const t = useTranslations();
  const { languages, initialSeo } = props;
  const {
    locale,
    freeze,
    saving,
    generating,
    warnings,
    currentDraft,
    updateField,
    handleLocaleChange,
    handleFreezeChange,
    submit,
    generate,
    errorFor,
  } = useSeoEditor(props);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" },
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await submit();
    const warningSuffix =
      result.status === "warning" && result.warnings && result.warnings.length > 0
        ? `: ${result.warnings.join(", ")}`
        : "";
    setToast({ open: true, message: `${result.message}${warningSuffix}` });
  };

  const handleGenerate = async () => {
    const result = await generate();
    setToast({ open: true, message: result.message });
  };

  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6">
          <SeoEditorHeader freeze={freeze} onFreezeChange={handleFreezeChange} />

          {languages.length > 1 && (
            <Tabs
              value={locale}
              onValueChange={handleLocaleChange}
              items={languages.map((l) => ({ value: l, label: l.toUpperCase() }))}
            />
          )}
          <Inline wrap gap={2} role="list">
            {languages.map((l) => {
              const draft = initialSeo[l] ?? { title: "", description: "" };
              const complete = Boolean(draft.title && draft.description);
              return (
                <Tag
                  key={l}
                  color={complete ? "success" : "warning"}
                  tone="soft"
                  size="sm"
                >
                  {l.toUpperCase()} {complete ? "Complete" : "Needs content"}
                </Tag>
              );
            })}
          </Inline>

          <form className="space-y-6" onSubmit={handleSubmit} id={`seo-editor-${locale}`}>
            <SeoSharedFields
              draft={currentDraft}
              updateField={updateField}
              errorFor={errorFor}
            />

            <SeoAdvancedSettings
              open={showAdvanced}
              onToggle={() => setShowAdvanced((open) => !open)}
              draft={currentDraft}
              updateField={updateField}
            />

            {warnings.length > 0 && (
              <>
                <Alert
                  variant="warning"
                  tone="soft"
                  heading={String(t("cms.seo.warnings"))}
                >
                  <ul className="list-disc pl-5">
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
                <p className="sr-only">{warnings.join(" ")}</p>
              </>
            )}

            <Stack gap={3} className="sm:flex-row sm:items-center sm:justify-between">
              <Inline className="min-w-0" gap={2}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? t("cms.seo.generating") : t("cms.seo.generateWithAi")}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? t("actions.saving") : t("actions.save")}
                </Button>
              </Inline>
              <p className="text-xs text-muted-foreground">
                {t("cms.seo.localeScopeHelp", { locale: locale.toUpperCase() })}
              </p>
            </Stack>
          </form>
        </CardContent>
      </Card>
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
    </>
  );
}
