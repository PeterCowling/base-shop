import type { Locale } from "@/i18n/locales";
import type { PageComponent } from "@acme/types";
import DOMPurify from "dompurify";
import { memo } from "react";
import { blockRegistry } from "../blocks";

function Block({ component, locale }: { component: PageComponent; locale: Locale }) {
  if (component.type === "Text") {
    const { text } =
      component as Extract<
        PageComponent,
        { type: "Text"; text?: string | Record<string, string> }
      >;
    const value = typeof text === "string" ? text : text?.[locale] ?? "";
    const sanitized = DOMPurify.sanitize(value);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }
  const entry = blockRegistry[component.type];
  if (!entry) return null;
  const Comp = entry.component;
  const { id, type, ...props } = component;
  return <Comp {...(props as Record<string, unknown>)} locale={locale} />;
}

export default memo(Block);
