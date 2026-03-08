import { permanentRedirect } from "next/navigation";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { generateLangParams } from "@/app/_lib/static-params";
import { getSlug } from "@/utils/slug";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export default async function LegacyGuidesIndexRedirectPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  permanentRedirect(`/${validLang}/${getSlug("experiences", validLang)}`);
}
