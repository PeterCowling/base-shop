/* eslint-disable ds/no-hardcoded-copy, ds/enforce-layout-primitives -- BRIK-DS-001: in-progress design-system migration */
import { memo } from "react";
import Link from "next/link";
import type { TFunction } from "i18next";

import { AlertTriangle, Car, Clock, Luggage, MapPin, Ship } from "@/icons";

import { Inline } from "../ui";

type ChecklistItem = {
  key: string;
  title: string;
  body: string;
  Icon: typeof MapPin;
  href?: string;
  cta?: string;
};

export type BeforeYouTravelProps = {
  t: TFunction<"howToGetHere">;
  parkingHref?: string;
};

function BeforeYouTravelBase({ t, parkingHref }: BeforeYouTravelProps) {
  const items: ChecklistItem[] = [
    {
      key: "stairs",
      title: t("beforeTravel.items.stairs.title", { defaultValue: "Positano basics: stairs + luggage" }),
      body: t("beforeTravel.items.stairs.body", {
        defaultValue:
          "Expect steps even for short walks. Pack light, and consider porters if you’re arriving via the port.",
      }),
      Icon: Luggage,
    },
    {
      key: "ferries",
      title: t("beforeTravel.items.ferries.title", { defaultValue: "Ferry season + cancellations" }),
      body: t("beforeTravel.items.ferries.body", {
        defaultValue:
          "Most ferries are seasonal and can cancel due to wind. Always check operator updates before you travel.",
      }),
      Icon: Ship,
    },
    {
      key: "late",
      title: t("beforeTravel.items.late.title", { defaultValue: "Late arrivals" }),
      body: t("beforeTravel.items.late.body", {
        defaultValue:
          "Evening/late-night options are limited. If you’re delayed, message us early so we can suggest the best fallback.",
      }),
      Icon: Clock,
    },
    {
      key: "taxis",
      title: t("beforeTravel.items.taxis.title", { defaultValue: "Taxis + exact address" }),
      body: t("beforeTravel.items.taxis.body", {
        defaultValue:
          "Some lanes can’t be reached by car. Use the exact address and aim for the closest drop-off near Chiesa Nuova.",
      }),
      Icon: MapPin,
    },
    {
      key: "parking",
      title: t("beforeTravel.items.parking.title", { defaultValue: "Arriving by car: parking plan" }),
      body: t("beforeTravel.items.parking.body", {
        defaultValue:
          "Driving in Positano is slow and stressful. Plan to park in a paid garage, then walk or taxi to Chiesa Nuova for the easiest luggage drop-off.",
      }),
      Icon: Car,
      href: parkingHref,
      cta: t("beforeTravel.items.parking.cta", { defaultValue: "Open arriving-by-car guide" }),
    },
    {
      key: "tickets",
      title: t("beforeTravel.items.tickets.title", { defaultValue: "Tickets" }),
      body: t("beforeTravel.items.tickets.body", {
        defaultValue:
          "Buy bus tickets before boarding when possible (tabacchi/newsstands). Keep change and ID handy in peak season.",
      }),
      Icon: AlertTriangle,
    },
  ];

  return (
    <section
      id="before-you-travel"
      className="scroll-mt-28 rounded-3xl border border-brand-outline/20 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/30 dark:bg-brand-surface/60"
    >
      <h2 className="text-xl font-semibold text-brand-heading dark:text-brand-text">
        {t("beforeTravel.title", { defaultValue: "Before you travel" })}
      </h2>
      <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-text/70">
        {t("beforeTravel.subtitle", { defaultValue: "High-value reminders to avoid common mistakes." })}
      </p>

      <ul className="mt-5 grid grid-cols-1 gap-4 list-none p-0 md:grid-cols-2">
        {items.map(({ key, title, body, Icon, href, cta }) => (
          <li
            key={key}
            className="rounded-2xl border border-brand-outline/10 bg-brand-bg/60 p-4 shadow-sm dark:border-brand-outline/30 dark:bg-brand-surface/40"
          >
            <Inline className="w-full items-start gap-3">
              <Inline as="span" className="mt-0.5 size-9 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-secondary/20 dark:text-brand-secondary">
                <Icon aria-hidden className="size-4" />
              </Inline>
              <div>
                <p className="text-sm font-semibold text-brand-heading dark:text-brand-text">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-text/80 dark:text-brand-text/80">
                  {body}
                </p>
                {href ? (
                  <Link
                    href={href}
                    className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 decoration-brand-heading/40 hover:decoration-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary"
                  >
                    {cta ?? t("beforeTravel.items.parking.cta", { defaultValue: "Open arriving-by-car guide" })}
                  </Link>
                ) : null}
              </div>
            </Inline>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const BeforeYouTravel = memo(BeforeYouTravelBase);
