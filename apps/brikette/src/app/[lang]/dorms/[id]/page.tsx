// src/app/[lang]/dorms/[id]/page.tsx
// Room detail page - App Router version
import { Suspense } from "react";
import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";

import { findRoomIdBySlug, getRoomSlug } from "@acme/ui/config/roomSlugs";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import roomsData, { type RoomId, websiteVisibleRoomsData } from "@/data/roomsData";
import { OG_IMAGE } from "@/utils/headConstants";
import { getPrivateRoomChildPath } from "@/utils/privateRoomPaths";
import { getSlug } from "@/utils/slug";

import RoomDetailContent from "./RoomDetailContent";

type Props = {
  params: Promise<{ lang: string; id: string }>;
};

// double_room has moved to the localized private-room detail route.
const PRIVATE_ROOM_IDS = new Set(["double_room"]);

export async function generateStaticParams() {
  const langParams = generateLangParams();
  const dormRooms = websiteVisibleRoomsData.filter((room) => !PRIVATE_ROOM_IDS.has(room.id));
  return langParams.flatMap(({ lang }) => {
    const validLang = toAppLanguage(lang);
    return dormRooms.map((room) => ({ lang, id: getRoomSlug(room.id, validLang) }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  const validLang = toAppLanguage(lang);
  const roomId = (findRoomIdBySlug(id, validLang) ?? id) as RoomId;
  const room = roomsData.find((r) => r.id === roomId);

  if (!room || room.isVisibleOnWebsite === false) {
    return {};
  }

  // Get room-specific translations
  const t = await getTranslations(validLang, "roomsPage");
  const meta = {
    title: (t(`rooms.${roomId}.title`, { defaultValue: roomId }) as string) || roomId,
    description:
      (t(`rooms.${roomId}.bed_intro`, { defaultValue: "" }) as string) ||
      `Details and photos for ${roomId.replace(/_/g, " ")} at Hostel Brikette in Positano.`,
  };

  const path = PRIVATE_ROOM_IDS.has(roomId)
    ? getPrivateRoomChildPath(validLang, "double-room")
    : `/${validLang}/${getSlug("rooms", validLang)}/${getRoomSlug(roomId, validLang)}`;
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

  const roomId = (findRoomIdBySlug(id, validLang) ?? id) as RoomId;

  // double_room has moved to the localized private-room detail route.
  if (PRIVATE_ROOM_IDS.has(roomId)) {
    redirect(getPrivateRoomChildPath(validLang, "double-room"));
  }
  const room = roomsData.find((r) => r.id === roomId);

  if (!room || room.isVisibleOnWebsite === false) {
    redirect(`/${validLang}/${getSlug("rooms", validLang)}`);
  }

  const canonicalSlug = getRoomSlug(roomId, validLang);
  if (id !== canonicalSlug) {
    permanentRedirect(`/${validLang}/${getSlug("rooms", validLang)}/${canonicalSlug}`);
  }

  const t = await getTranslations(validLang, "roomsPage");
  const noscriptMessage = (t("noscript.jsDisabledAssistance") as string) || "";
  const noscriptLinkLabel = (t("noscript.contactAssistedBooking") as string) || "";

  return (
    <>
      <Suspense fallback={null}>
        <RoomDetailContent lang={validLang} id={roomId} />
      </Suspense>
      <noscript>
        <div>
          {noscriptMessage}{" "}
          <a
            href="mailto:hostelpositano@gmail.com?subject=Hostel%20room%20assistance"
            rel="nofollow noopener noreferrer"
          >
            {noscriptLinkLabel}
          </a>
          .
        </div>
      </noscript>
    </>
  );
}
