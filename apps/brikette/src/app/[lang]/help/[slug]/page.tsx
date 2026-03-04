import { toAppLanguage } from "@/app/_lib/i18n-server";
import {
  generateLegacyGuideAliasStaticParams,
  redirectLegacyGuideAlias,
} from "@/app/_lib/legacy-guide-alias";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateStaticParams() {
  return generateLegacyGuideAliasStaticParams();
}

export default async function LegacyHelpGuideRedirectPage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);

  redirectLegacyGuideAlias(validLang, slug);
}
