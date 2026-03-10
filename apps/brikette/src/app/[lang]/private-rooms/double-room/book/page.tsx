// apps/brikette/src/app/[lang]/private-rooms/double-room/book/page.tsx
// Double private room booking page — separate endpoint from apartment (TASK-12a decision).
import { Suspense } from "react";
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";
import { getDoubleRoomBookingPath } from "@/utils/localizedRoutes";

import DoubleRoomBookContent from "./DoubleRoomBookContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, "roomsPage");

  const title = (t("rooms.double_room.title") as string) || "Double Room — Book Direct"; // i18n-exempt -- BRIK-001 [ttl=2026-12-31] meta fallback only, not rendered in UI
  const description = (t("rooms.double_room.bed_description") as string) || "";
  const path = getDoubleRoomBookingPath(validLang);

  const image = buildCfImageUrl("/img/7/landing.webp", {
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
    isPublished: true,
  });
}

export default async function DoubleRoomBookPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  await getTranslations(validLang, ["bookPage", "roomsPage", "modals"]);

  return (
    <Suspense fallback={null}>
      <DoubleRoomBookContent lang={validLang} />
    </Suspense>
  );
}
