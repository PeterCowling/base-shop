"use client";

import dynamic from "next/dynamic";
import type { AppLanguage } from "@/i18n.config";

// Dynamically import GuideEditor to avoid SSR hydration issues with TipTap
const GuideEditor = dynamic(() => import("./GuideEditor"), { ssr: false });

type Props = {
  lang: AppLanguage;
  guideKey: string;
  contentKey: string;
  availableLocales: readonly AppLanguage[];
  initialLocale?: AppLanguage;
};

export default function GuideEditorWrapper(props: Props) {
  return <GuideEditor {...props} />;
}
