import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import SecureBookingPageClient from "@/components/booking/SecureBookingPageClient";
import { OCTORATE_CUSTOM_PAGE_ENABLED, OCTORATE_CUSTOM_PAGE_GLOBAL_KEY, OCTORATE_CUSTOM_PAGE_SCRIPT_SRC } from "@/config/env";
import { BOOKING_CODE } from "@/context/modal/constants";
import roomsData from "@/data/roomsData";
import { OG_IMAGE } from "@/utils/headConstants";
import { getBookPath } from "@/utils/localizedRoutes";
import { resolveLabel } from "@/utils/translation-fallback";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"], { optional: true });

  const title = resolveLabel(
    t,
    "secureBooking.meta.title",
    resolveLabel(t, "secureBooking.heading", resolveLabel(t, "heading", "")),
  );
  const description = resolveLabel(
    t,
    "secureBooking.meta.description",
    resolveLabel(t, "meta.description", ""),
  );
  const path = `/${validLang}/book/secure-booking`;

  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
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

export default async function SecureBookingPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  if (!OCTORATE_CUSTOM_PAGE_ENABLED) {
    notFound();
  }

  const tBook = await getTranslations(validLang, ["bookPage"], { optional: true });
  const tRooms = await getTranslations(validLang, ["roomsPage"], { optional: true });
  const roomLabels = Object.fromEntries(
    roomsData.map((room) => [
      room.id,
      resolveLabel(tRooms, `rooms.${room.id}.title`, room.id.replace(/_/gu, " ")),
    ])
  );
  const ratePlanLabels = {
    flex: resolveLabel(tBook, "flex.title", ""),
    nr: resolveLabel(tBook, "nr.title", ""),
  };

  /* eslint-disable ds/no-hardcoded-copy -- TASK-08 [ttl=2026-12-31] i18n-exempt: noscript-only fallback strings, not rendered in normal UI */
  const noscriptMessage = resolveLabel(
    tBook,
    "noscript.jsDisabledAssistance",
    "Hostel bookings are handled with assisted support when JavaScript is disabled.",
  );
  const noscriptLinkLabel = resolveLabel(
    tBook,
    "noscript.emailAssistedBooking",
    "Email us for assisted booking",
  );
  const continueLabel = resolveLabel(
    tBook,
    "secureBooking.continueLabel",
    "Continue to secure booking",
  );
  /* eslint-enable ds/no-hardcoded-copy */

  return (
    <>
      <main className="px-6 pb-16 pt-24 sm:pt-10">
        <Suspense fallback={null}>
          <SecureBookingPageClient
            bookPath={getBookPath(validLang)}
            bookingCode={BOOKING_CODE}
            labels={{
              continue: continueLabel,
              heading: resolveLabel(tBook, "secureBooking.heading", ""),
              loading: resolveLabel(tBook, "secureBooking.loadingText", ""),
              ready: resolveLabel(tBook, "secureBooking.readyText", ""),
              fallbackTitle: resolveLabel(tBook, "secureBooking.fallbackTitle", ""),
              fallbackBody: resolveLabel(tBook, "secureBooking.fallbackBody", ""),
              security: resolveLabel(tBook, "secureBooking.securityNote", ""),
              step: resolveLabel(tBook, "secureBooking.stepLabel", ""),
              supporting: resolveLabel(tBook, "secureBooking.supportingText", ""),
              widgetHost: resolveLabel(tBook, "secureBooking.widgetHostLabel", ""),
            }}
            ratePlanLabels={ratePlanLabels}
            roomLabels={roomLabels}
            summaryLabels={{
              checkin: resolveLabel(tBook, "secureBooking.labels.checkIn", "Check-in"),
              checkout: resolveLabel(tBook, "secureBooking.labels.checkOut", "Check-out"),
              guests: resolveLabel(tBook, "secureBooking.labels.guests", "Guests"),
              rate: resolveLabel(tBook, "secureBooking.labels.ratePlan", "Rate plan"),
              room: resolveLabel(tBook, "secureBooking.labels.room", "Room"),
            }}
            widgetGlobalKey={OCTORATE_CUSTOM_PAGE_GLOBAL_KEY}
            widgetScriptSrc={OCTORATE_CUSTOM_PAGE_SCRIPT_SRC}
          />
        </Suspense>
      </main>
      <noscript>
        <div>
          {noscriptMessage}{" "}
          <a
            href={getBookPath(validLang)}
            rel="nofollow noopener noreferrer"
          >
            {continueLabel}
          </a>
          .{" "}
          <a
            href="mailto:hostelpositano@gmail.com?subject=Hostel%20booking%20assistance"
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
