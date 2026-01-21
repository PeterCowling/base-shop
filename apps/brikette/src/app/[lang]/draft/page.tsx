// src/app/[lang]/draft/page.tsx
// Draft guides dashboard - App Router version
import type { Metadata } from "next";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";

import DraftDashboardContent from "./DraftDashboardContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  const path = `/${validLang}/draft`;

  return buildAppMetadata({
    lang: validLang,
    title: "Guides draft dashboard",
    description: "Track publication status and outstanding tasks for every guide.",
    path,
    ogType: "website",
  });
}

export default async function DraftPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return <DraftDashboardContent lang={validLang} />;
}
