"use client";

import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import Block from "./Block";
import InlineEditableButton from "./InlineEditableButton";
import type { InlineTextApi } from "./useInlineText";

type Props = {
  component: PageComponent & { pbViewport?: "desktop" | "tablet" | "mobile" };
  locale: Locale;
  isInlineEditableButton: boolean;
  inline: InlineTextApi<{ label?: string }, "label"> | null;
  dispatch: React.Dispatch<import("./state").Action>;
};

export default function BlockContent({ component, locale, isInlineEditableButton, inline, dispatch }: Props) {
  if (isInlineEditableButton) {
    return (
      <InlineEditableButton
        component={component as unknown as { label?: string; href?: string; variant?: string; size?: string }}
        locale={locale}
        inline={inline!}
        onCommit={(patch) => dispatch({ type: "update", id: component.id, patch: patch as Partial<PageComponent> })}
      />
    );
  }
  return <Block component={component} locale={locale} />;
}
