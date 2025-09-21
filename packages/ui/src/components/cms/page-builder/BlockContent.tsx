"use client";

import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import Block from "./Block";
import InlineEditableButton from "./InlineEditableButton";

type Props = {
  component: PageComponent & { pbViewport?: "desktop" | "tablet" | "mobile" };
  locale: Locale;
  isInlineEditableButton: boolean;
  inline: any | null;
  dispatch: React.Dispatch<any>;
};

export default function BlockContent({ component, locale, isInlineEditableButton, inline, dispatch }: Props) {
  if (isInlineEditableButton) {
    return (
      <InlineEditableButton
        component={component as any}
        locale={locale}
        inline={inline as any}
        onCommit={(patch) => dispatch({ type: "update", id: component.id, patch: patch as any })}
      />
    );
  }
  return <Block component={component as any} locale={locale} />;
}

