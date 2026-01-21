"use client";

import type { ReactNode } from "react";

import type { AppLanguage } from "@/i18n.config";
import AppLayout from "@/components/layout/AppLayout";

type Props = {
  lang: AppLanguage;
  children: ReactNode;
};

export default function ClientLayout({ lang, children }: Props) {
  return <AppLayout lang={lang}>{children}</AppLayout>;
}
