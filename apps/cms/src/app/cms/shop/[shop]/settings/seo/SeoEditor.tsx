"use client";

import { FormEvent, useState } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import type { Locale } from "@acme/types";

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
};

export default function SeoEditor(props: UseSeoEditorProps) {
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

          <Tabs
            value={locale}
            onValueChange={handleLocaleChange}
            items={languages.map((l) => ({ value: l, label: l.toUpperCase() }))}
          />

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
              <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
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
