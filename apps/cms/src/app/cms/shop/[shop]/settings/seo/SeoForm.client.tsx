"use client";

import { Button } from "@/components/atoms/shadcn";
import type { Locale } from "@acme/types";
import SeoLanguageTabs from "./SeoLanguageTabs";
import type { SeoRecord } from "./useSeoForm";
import useSeoForm from "./useSeoForm";

interface Props {
  shop: string;
  languages: readonly Locale[];
  initialSeo: Record<string, Partial<SeoRecord>>;
  baseLocale?: Locale;
}

const TITLE_LIMIT = 70;
const DESC_LIMIT = 160;

export default function SeoForm(props: Props) {
  const {
    locale,
    setLocale,
    seo,
    baseLocale,
    handleChange,
    handleSubmit,
    saving,
    errors,
    warnings,
  } = useSeoForm(props);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SeoLanguageTabs
        languages={props.languages}
        locale={locale}
        onLocaleChange={setLocale}
        seo={seo}
        onFieldChange={handleChange}
        titleLimit={TITLE_LIMIT}
        descLimit={DESC_LIMIT}
        baseLocale={baseLocale}
      />

      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-danger-foreground">
          {Object.entries(errors).map(([k, v]) => (
            <p key={k}>{v.join("; ")}</p>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="text-sm text-warning-foreground">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
