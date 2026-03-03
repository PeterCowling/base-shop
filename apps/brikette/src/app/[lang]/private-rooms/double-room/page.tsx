// src/app/[lang]/private-rooms/double-room/page.tsx
// Double Room detail page under the private-rooms section
import { Suspense } from "react";
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import roomsData from "@/data/roomsData";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import RoomDetailContent from "../../dorms/[id]/RoomDetailContent";

const ROOM_ID = "double_room" as const;

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const room = roomsData.find((r) => r.id === ROOM_ID);

  if (!room) return {};

  const t = await getTranslations(validLang, "roomsPage");
  const title =
    (t(`rooms.${ROOM_ID}.title`, { defaultValue: ROOM_ID }) as string) || ROOM_ID;
  const description =
    (t(`rooms.${ROOM_ID}.bed_intro`, { defaultValue: "" }) as string) || "";

  const privateRoomsSlug = getSlug("apartment", validLang);
  const path = `/${validLang}/${privateRoomsSlug}/double-room`;
  const image = buildCfImageUrl(room.landingImage || "/img/og-rooms.jpg", {
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

export default async function DoubleRoomPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  await getTranslations(validLang, ["roomsPage", "guides", "pages.rooms", "rooms"]);

  return (
    <Suspense fallback={null}>
      <RoomDetailContent lang={validLang} id={ROOM_ID} />
    </Suspense>
  );
}
