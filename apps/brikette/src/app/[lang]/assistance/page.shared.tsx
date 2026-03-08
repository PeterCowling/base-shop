import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { loadAssistanceIndexI18nBundle } from "@/app/_lib/assistance-index-i18n-bundle";
import { resolveI18nMetaForApp } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import type { AppLanguage } from "@/i18n.config";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import AssistanceIndexContent from "./AssistanceIndexContent";

export async function generateAssistanceIndexMetadata(lang: AppLanguage): Promise<Metadata> {
  const meta = await resolveI18nMetaForApp(lang, "assistanceSection");
  const assistanceSlug = getSlug("assistance", lang);
  const path = `/${lang}/${assistanceSlug}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  return buildAppMetadata({
    lang,
    title: meta.title,
    description: meta.description,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
}

export async function renderAssistanceIndexPage(lang: AppLanguage): Promise<JSX.Element> {
  const serverI18n = await loadAssistanceIndexI18nBundle(lang);
  return <AssistanceIndexContent lang={lang} serverI18n={serverI18n} />;
}
