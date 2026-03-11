import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";

import {
  generateAssistanceIndexMetadata,
  renderAssistanceIndexPage,
} from "../assistance/page.shared";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const assistanceSlug = getSlug("assistance", validLang);

  if (assistanceSlug !== "help") {
    return {};
  }

  return generateAssistanceIndexMetadata(validLang);
}

export default async function HelpIndexPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const assistanceSlug = getSlug("assistance", validLang);

  if (assistanceSlug !== "help") {
    permanentRedirect(`/${validLang}/${assistanceSlug}`);
  }

  return renderAssistanceIndexPage(validLang);
}
