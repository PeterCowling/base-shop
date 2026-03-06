import Image from "next/image";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";

import { getTranslations } from "@/app/_lib/i18n-server";
import roomsData from "@/data/roomsData";
import type { AppLanguage } from "@/i18n.config";
import { getPrivateBookingPath } from "@/utils/localizedRoutes";
import { translatePath } from "@/utils/translate-path";

type Props = {
  lang: AppLanguage;
};

export default async function PrivateRoomsSummaryContent({ lang }: Props) {
  const tRoomsPage = await getTranslations(lang, "roomsPage");
  const tApartment = await getTranslations(lang, "apartmentPage");

  const privateRoomsPath = `/${lang}/${translatePath("apartment", lang)}`;
  const privateBookingPath = getPrivateBookingPath(lang);
  const apartmentRoom = roomsData.find((room) => room.id === "apartment");
  const doubleRoom = roomsData.find((room) => room.id === "double_room");
  const apartmentDetailsRaw = tApartment("detailsList", { returnObjects: true }) as unknown;
  const apartmentDetails = Array.isArray(apartmentDetailsRaw)
    ? apartmentDetailsRaw.filter((item): item is string => typeof item === "string")
    : [];
  const doubleFacilities = [
    tRoomsPage("facilities.privateRoom") as string,
    tRoomsPage("facilities.doubleBedForTwo") as string,
    tRoomsPage("facilities.bathroomEnsuite") as string,
    tRoomsPage("facilities.seaViewTerrace") as string,
    tRoomsPage("facilities.airCon") as string,
  ];

  const cards = [
    {
      href: `${privateRoomsPath}/apartment`,
      image: apartmentRoom?.landingImage ?? "/img/facade.avif",
      title: tApartment("title") as string,
      description: tApartment("body") as string,
      highlights: apartmentDetails,
    },
    {
      href: `${privateRoomsPath}/double-room`,
      image: doubleRoom?.landingImage ?? "/img/7/landing.webp",
      title: tRoomsPage("rooms.double_room.title") as string,
      description: tRoomsPage("rooms.double_room.bed_description") as string,
      highlights: doubleFacilities,
    },
  ];

  return (
    <Section padding="none" className="mx-auto max-w-6xl p-6 pt-24 sm:pt-10">
      <div className="space-y-10">
        <h1 className="text-center text-3xl font-bold text-brand-heading sm:text-4xl">
          {tRoomsPage("filters.private") as string}
        </h1>
        <p className="mx-auto text-center text-base text-brand-text/85 sm:text-lg">
          {tApartment("heroIntro") as string}
        </p>

        <Grid cols={1} gap={6} className="md:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.href}
              className="overflow-hidden rounded-2xl border border-brand-outline/30 bg-brand-surface shadow-sm"
            >
              <Image
                src={card.image}
                alt={card.title}
                width={1200}
                height={800}
                className="h-56 w-full object-cover"
                data-aspect="3/2"
              />
              <div className="space-y-4 p-6">
                <h2 className="text-2xl font-semibold text-brand-heading">{card.title}</h2>
                <p className="text-sm text-brand-text/85">{card.description}</p>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-brand-heading">
                    {tRoomsPage("details") as string}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-brand-text/80">
                    {card.highlights.map((item) => (
                      <li key={`${card.href}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={card.href}
                    className="inline-flex min-h-11 items-center rounded-xl border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
                  >
                    {tRoomsPage("moreAboutThisRoom") as string}
                  </Link>
                  <Link
                    href={privateBookingPath}
                    className="inline-flex min-h-11 items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-on-primary transition-opacity hover:opacity-90"
                  >
                    {tApartment("checkAvailability") as string}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </Grid>
      </div>
    </Section>
  );
}
