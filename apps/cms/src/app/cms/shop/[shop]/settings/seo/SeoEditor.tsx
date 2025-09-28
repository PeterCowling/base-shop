"use client";

import { FormEvent, useState } from "react";

import { Alert, Toast } from "@/components/atoms";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import type { Locale } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import { Inline } from "@ui/components/atoms/primitives/Inline";
import { Stack } from "@ui/components/atoms/primitives/Stack";
import clsx from "clsx";

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
  const { languages } = props;
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
    setToast({ open: true, message: result.message });
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

          <form className="space-y-6" onSubmit={handleSubmit}>
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
              <Alert variant="warning" tone="soft" heading={String(t("cms.seo.warnings"))}>
                <ul className="list-disc pl-5">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </Alert>
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
