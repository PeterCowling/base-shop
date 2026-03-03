"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";

import roomsData from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { translatePath } from "@/utils/translate-path";

type Props = {
  lang: AppLanguage;
};

function PrivateRoomsSummaryContent({ lang }: Props) {
  const { t: tRooms } = useTranslation("roomsPage", { lng: lang });
  const { t: tApartment } = useTranslation("apartmentPage", { lng: lang });
  usePagePreload({ lang, namespaces: ["roomsPage", "apartmentPage"] });

  const privateRoomsPath = `/${lang}/${translatePath("apartment", lang)}`;
  const apartmentRoom = roomsData.find((room) => room.id === "apartment");
  const doubleRoom = roomsData.find((room) => room.id === "double_room");

  const cards = [
    {
      href: `${privateRoomsPath}/apartment`,
      image: apartmentRoom?.landingImage ?? "/img/facade.avif",
      title: tApartment("title") as string,
      description: tApartment("body") as string,
    },
    {
      href: `${privateRoomsPath}/double-room`,
      image: doubleRoom?.landingImage ?? "/img/7/landing.webp",
      title: tRooms("rooms.double_room.title") as string,
      description: tRooms("rooms.double_room.bed_intro") as string,
    },
  ];

  return (
    <Section padding="none" className="mx-auto max-w-6xl p-6 pt-24 sm:pt-10">
      <div className="space-y-6">
        <h1 className="text-center text-3xl font-bold text-brand-heading sm:text-4xl">
          {tRooms("filters.private") as string}
        </h1>
        <Grid cols={1} gap={6} className="md:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.href}
              className="overflow-hidden rounded-2xl border border-brand-outline/30 bg-brand-surface shadow-sm"
            >
              <Link href={card.href} className="block h-full">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={1200}
                  height={800}
                  className="h-56 w-full object-cover"
                  data-aspect="3/2"
                />
                <div className="space-y-3 p-6">
                  <h2 className="text-2xl font-semibold text-brand-heading">{card.title}</h2>
                  <p className="text-sm text-brand-text/85">{card.description}</p>
                  <p className="text-sm font-semibold text-brand-primary">
                    {tRooms("moreAboutThisRoom") as string}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </Grid>
      </div>
    </Section>
  );
}

export default memo(PrivateRoomsSummaryContent);
