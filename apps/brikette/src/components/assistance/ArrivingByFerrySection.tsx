// src/components/assistance/ArrivingByFerrySection.tsx
import { memo } from "react";

import ArrivingByFerrySectionUI from "@acme/ui/organisms/ArrivingByFerrySection";

import { i18nConfig } from "@/i18n.config";

function ArrivingByFerrySection({ lang }: { lang?: string }): JSX.Element {
  const resolvedLang = (lang ?? i18nConfig.fallbackLng) as string;
  return <ArrivingByFerrySectionUI lang={resolvedLang} />;
}

export default memo(ArrivingByFerrySection);
