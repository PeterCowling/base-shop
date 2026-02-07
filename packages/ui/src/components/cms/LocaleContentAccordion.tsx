import type { ReactNode } from "react";

import type { Locale } from "@acme/i18n/locales";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../atoms/shadcn";

export interface LocalePanelConfig {
  locale: Locale;
  trigger: ReactNode;
  content: ReactNode;
}

interface LocaleContentAccordionProps {
  panels: LocalePanelConfig[];
  defaultOpenLocales: readonly Locale[];
}

export default function LocaleContentAccordion({
  panels,
  defaultOpenLocales,
}: LocaleContentAccordionProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpenLocales as string[]}
      className="space-y-3"
    >
      {panels.map(({ locale, trigger, content }) => (
        <AccordionItem key={locale} value={locale} className="border-none">
          <AccordionTrigger className="rounded-md border border-border-3 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
            {trigger}
          </AccordionTrigger>
          <AccordionContent className="pt-3">{content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
