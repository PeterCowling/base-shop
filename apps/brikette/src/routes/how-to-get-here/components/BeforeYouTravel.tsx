import { memo } from "react";
import type { TFunction } from "i18next";
import { AlertTriangle, Clock, Luggage, MapPin,Ship } from "lucide-react";

import { Grid } from "@acme/ui/atoms";

import { Inline } from "../ui";

type ChecklistItem = { key: string; title: string; body: string; Icon: typeof MapPin };

export type BeforeYouTravelProps = {
  t: TFunction<"howToGetHere">;
};

function BeforeYouTravelBase({ t }: BeforeYouTravelProps) {
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
    <section className="rounded-3xl border border-brand-outline/20 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/30 dark:bg-brand-surface/60">
      <h2 className="text-xl font-semibold text-brand-heading dark:text-brand-surface">
        {t("beforeTravel.title", { defaultValue: "Before you travel" })}
      </h2>
      <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/70">
        {t("beforeTravel.subtitle", { defaultValue: "High-value reminders to avoid common mistakes." })}
      </p>

      <Grid as="ul" columns={{ base: 1, md: 2 }} gap={4} className="mt-5 list-none p-0">
        {items.map(({ key, title, body, Icon }) => (
          <li
            key={key}
            className="rounded-2xl border border-brand-outline/10 bg-brand-bg/60 p-4 shadow-sm dark:border-brand-outline/30 dark:bg-brand-surface/40"
          >
            <Inline className="w-full items-start gap-3">
              <Inline as="span" className="mt-0.5 size-9 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-secondary/20 dark:text-brand-secondary">
                <Icon aria-hidden className="size-4" />
              </Inline>
              <div>
                <p className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-text/80 dark:text-brand-surface/80">
                  {body}
                </p>
              </div>
            </Inline>
          </li>
        ))}
      </Grid>
    </section>
  );
}

export const BeforeYouTravel = memo(BeforeYouTravelBase);
