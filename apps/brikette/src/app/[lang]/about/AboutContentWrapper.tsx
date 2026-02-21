"use client";

// src/app/[lang]/about/AboutContentWrapper.tsx
// Client wrapper for about page to enable ContentStickyCta
import type { ReactNode } from "react";

import { ContentStickyCta } from "@/components/cta/ContentStickyCta";
import type { AppLanguage } from "@/i18n.config";

type Props = {
  lang: AppLanguage;
  children: ReactNode;
};

export function AboutContentWrapper({ lang, children }: Props) {
  return (
    <>
      {children}
      <ContentStickyCta lang={lang} ctaLocation="about_page" />
    </>
  );
}
