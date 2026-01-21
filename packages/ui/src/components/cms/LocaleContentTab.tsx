import type { ChangeEvent } from "react";

import type { Locale } from "@acme/i18n/locales";

import { Chip } from "../atoms";
import { Card, CardContent, Input, Textarea } from "../atoms/shadcn";

import LocaleContentAccordion, {
  type LocalePanelConfig,
} from "./LocaleContentAccordion";

interface LocaleContentTabProps {
  locales: readonly Locale[];
  title: Partial<Record<Locale, string>>;
  description: Partial<Record<Locale, string>>;
  onFieldChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const localeLabel: Partial<Record<Locale, string>> = {
  en: "English",
};

export default function LocaleContentTab({
  locales,
  title,
  description,
  onFieldChange,
}: LocaleContentTabProps) {
  const localePanels: LocalePanelConfig[] = locales.map((locale) => ({
    locale,
    trigger: (
      <div className="flex items-center gap-2">
        <Chip className="bg-muted px-2 py-1 text-xs uppercase tracking-wide">
          {locale}
        </Chip>
        <span className="text-sm text-muted-foreground">
          {localeLabel[locale] ?? locale.toUpperCase()}
        </span>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <label className="flex flex-col gap-1" htmlFor={`title_${locale}`}>
          <span className="text-sm font-medium">Title</span>
          <Input
            id={`title_${locale}`}
            name={`title_${locale}`}
            value={title?.[locale] ?? ""}
            onChange={(event) => onFieldChange(event)}
          />
        </label>
        <label className="flex flex-col gap-1" htmlFor={`desc_${locale}`}>
          <span className="text-sm font-medium">Description</span>
          <Textarea
            id={`desc_${locale}`}
            rows={5}
            name={`desc_${locale}`}
            value={description?.[locale] ?? ""}
            onChange={(event) => onFieldChange(event)}
          />
        </label>
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <LocaleContentAccordion
            panels={localePanels}
            defaultOpenLocales={locales}
          />
        </CardContent>
      </Card>
    </div>
  );
}
