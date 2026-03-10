// src/app/[lang]/private-rooms/private-stay/page.tsx
// Private stay page - App Router version
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getNamespaceBundles, getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";
import { getPrivateRoomChildPath } from "@/utils/privateRoomPaths";

import PrivateStayContent from "./PrivateStayContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["apartmentPage"]);

  const title = (t("privateStay.meta.title") as string) || "";
  const description = (t("privateStay.meta.description") as string) || "";

  const path = getPrivateRoomChildPath(validLang, "private-stay");

  const image = buildCfImageUrl("/img/facade.avif", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
}

export default async function PrivateStayPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const preloadedNamespaceBundles = await getNamespaceBundles(validLang, ["apartmentPage"]);

  return <PrivateStayContent lang={validLang} preloadedNamespaceBundles={preloadedNamespaceBundles} />;
}
