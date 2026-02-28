// src/app/[lang]/dorms/[id]/page.tsx
// Room detail page - App Router version
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import roomsData, { type RoomId } from "@/data/roomsData";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import RoomDetailContent from "./RoomDetailContent";

type Props = {
  params: Promise<{ lang: string; id: string }>;
};

// double_room has moved to /private-rooms/double-room
const PRIVATE_ROOM_IDS = new Set(["double_room"]);

export async function generateStaticParams() {
  const langParams = generateLangParams();
  const roomIds = roomsData
    .map((room) => room.id)
    .filter((id) => !PRIVATE_ROOM_IDS.has(id));
  return langParams.flatMap(({ lang }) =>
    roomIds.map((id) => ({ lang, id }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  const validLang = toAppLanguage(lang);
  const room = roomsData.find((r) => r.id === id);

  if (!room) {
    return {};
  }

  // Get room-specific translations
  const t = await getTranslations(validLang, "roomsPage");
  const meta = {
    title: (t(`rooms.${id}.title`, { defaultValue: id }) as string) || id,
    description: (t(`rooms.${id}.bed_intro`, { defaultValue: "" }) as string) || "",
  };

  const roomsSlug = getSlug("rooms", validLang);
  const path = `/${validLang}/${roomsSlug}/${id}`;
  const image = buildCfImageUrl(room.landingImage || "/img/og-rooms.jpg", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
}

export default async function RoomDetailPage({ params }: Props) {
  const { lang, id } = await params;
  const validLang = toAppLanguage(lang);

  // double_room has moved to /private-rooms/double-room
  if (PRIVATE_ROOM_IDS.has(id)) {
    redirect(`/${validLang}/${getSlug("apartment", validLang)}/double-room`);
  }

  const room = roomsData.find((r) => r.id === id);

  if (!room) {
    redirect(`/${validLang}/${getSlug("rooms", validLang)}`);
  }

  await getTranslations(validLang, ["roomsPage", "guides", "pages.rooms", "rooms"]);

  return (
    <Suspense fallback={null}>
      <RoomDetailContent lang={validLang} id={id as RoomId} />
    </Suspense>
  );
}
