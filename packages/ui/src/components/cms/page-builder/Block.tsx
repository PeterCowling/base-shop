import type { Locale } from "@/i18n/locales";
import type { PageComponent } from "@acme/types";
import DOMPurify from "dompurify";
import { memo } from "react";
import { blockRegistry } from "../blocks";

function Block({ component, locale }: { component: PageComponent; locale: Locale }) {
  if (component.type === "Text") {
    const text = (component as any).text;
    const value = typeof text === "string" ? text : (text?.[locale] ?? "");
    const sanitized = DOMPurify.sanitize(value);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }
  const Comp = blockRegistry[component.type];
  if (!Comp) return null;
  const { id, type, ...props } = component as any;
  return <Comp {...props} locale={locale} />;
}

export default memo(Block);
