"use client";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/types";

import { Alert } from "@/components/atoms";
import { Button } from "@/components/atoms/shadcn";

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
  const t = useTranslations();

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
        <Alert
          variant="danger"
          tone="soft"
          heading={String(
            t("cms.shop.settings.validation.resolveIssues"),
          )}
        >
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([k, v]) => (
              <li key={k}>{v.join("; ")}</li>
            ))}
          </ul>
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert
          variant="warning"
          tone="soft"
          heading={String(t("common.warnings"))}
        >
          <ul className="list-disc pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? String(t("actions.saving")) : String(t("actions.save"))}
      </Button>
    </form>
  );
}
