import { Suspense } from "react";
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";

import BookPageContent from "../book/BookPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

const PRIVATE_BOOKING_SLUG = "book-private-accomodations";

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"], { optional: true });

  const title = (t("apartment.meta.title") as string) ?? "";
  const description = (t("apartment.meta.description") as string) ?? "";
  const path = `/${validLang}/${PRIVATE_BOOKING_SLUG}`;

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
    isPublished: false,
  });
}

export default async function BookPrivateAccomodationsPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"], { optional: true });
  const heading = (t("apartment.heading") as string) || "";

  return (
    <>
      <Suspense fallback={null}>
        <BookPageContent
          lang={validLang}
          heading={heading}
          includedRoomIds={["double_room", "apartment"]}
        />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line ds/no-hardcoded-copy -- i18n-exempt: noscript-only technical fallback for no-JS users, not rendered in normal UI. TASK-08 [ttl=2026-12-31] */}
        <a href="https://book.octorate.com/octobook/site/reservation/calendar.xhtml?codice=45111">
          Check availability
        </a>
      </noscript>
    </>
  );
}
