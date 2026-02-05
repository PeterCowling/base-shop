import { Trans } from "react-i18next";
import clsx from "clsx";
import type { TFunction } from "i18next";
import { AlertTriangle } from "@/icons";

import { CONTACT_EMAIL } from "@/config/hotel";

import { IntroHighlightCard } from "../IntroHighlightCard";
import { SEA_HORSE_SHUTTLE_URL } from "../styles";
import { Cluster, Inline } from "../ui";

const LATE_NIGHT_EMPHASIS_CLASS = "ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-secondary dark:ring-brand-secondary";

const ACTION_BUTTON_CLASS = [
  "inline-flex",
  "min-h-11",
  "min-w-11",
  "items-center",
  "justify-center",
  "rounded-xl",
  "bg-brand-surface",
  "px-4",
  "py-2",
  "text-sm",
  "font-semibold",
  "text-brand-heading",
  "shadow-sm",
  "transition",
  "hover:bg-brand-surface/80",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:bg-brand-surface/40",
  "dark:text-brand-text",
  "dark:hover:bg-brand-surface/50",
  "dark:focus-visible:outline-brand-secondary",
].join(" ");

const PRIMARY_BUTTON_CLASS = [
  "inline-flex",
  "min-h-11",
  "min-w-11",
  "items-center",
  "justify-center",
  "rounded-xl",
  "bg-brand-primary",
  "px-4",
  "py-2",
  "text-sm",
  "font-semibold",
  "text-brand-bg",
  "shadow-sm",
  "transition",
  "hover:bg-brand-primary/90",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:bg-brand-secondary",
  "dark:text-brand-text",
  "dark:hover:bg-brand-secondary/90",
  "dark:focus-visible:outline-brand-secondary",
].join(" ");

export type IntroHighlightsProps = {
  t: TFunction<"howToGetHere">;
  introKey: string;
  taxiEyebrow: string;
  taxiContact: string;
  shuttleEyebrow: string;
  /** When true, adds visual emphasis to the taxi card (for late-night arrivals) */
  isLateNight?: boolean;
};

export function IntroHighlights({ t, introKey, taxiEyebrow, taxiContact, shuttleEyebrow, isLateNight = false }: IntroHighlightsProps) {
  const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "").trim();
  const phone = normalizePhone(taxiContact);
  const whatsappNumber = phone.replace(/^\+/, "");
  const whatsappMessage = t(`${introKey}.whatsappTemplate`, {
    defaultValue:
      "Hi! I’m staying at Hostel Brikette. I’d like to book a taxi to/from Positano. My arrival time is: ____",
  });
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    : null;
  const telHref = phone ? `tel:${phone}` : null;
  const emailHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    t(`${introKey}.emailSubject`, { defaultValue: "Arrival help" }),
  )}&body=${encodeURIComponent(
    t(`${introKey}.emailBody`, {
      defaultValue:
        "Hi Hostel Brikette team — I’m arriving today and need help choosing the best way to get there. My ETA is: ____",
    }),
  )}`;

  return (
    <div className="rounded-3xl bg-brand-secondary px-6 py-8 text-brand-heading shadow-sm dark:bg-brand-secondary">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 text-base leading-relaxed">
        <IntroHighlightCard
          eyebrow={taxiEyebrow}
          className={clsx(isLateNight && LATE_NIGHT_EMPHASIS_CLASS)}
        >
          <p>
            <Trans
              i18nKey={`${introKey}.taxi`}
              t={t}
              components={{ Strong: <span className="font-semibold" /> }}
              values={{ contact: taxiContact }}
            />
          </p>
          <Cluster as="div" className="mt-4">
            {whatsappHref ? (
              <a className={PRIMARY_BUTTON_CLASS} href={whatsappHref} rel="noopener noreferrer" target="_blank">
                {t(`${introKey}.whatsappCta`, { defaultValue: "WhatsApp taxi" })}
              </a>
            ) : null}
            {telHref ? (
              <a className={ACTION_BUTTON_CLASS} href={telHref}>
                {t(`${introKey}.callCta`, { defaultValue: "Call" })}
              </a>
            ) : null}
          </Cluster>
            <p className="mt-3 text-sm text-brand-heading/80 dark:text-brand-text/80">
            {t(`${introKey}.taxiBestFor`, {
              defaultValue: "Best for: late arrivals · heavy luggage · fastest option",
            })}
          </p>
        </IntroHighlightCard>

        <IntroHighlightCard eyebrow={shuttleEyebrow}>
          <p>
            <Trans
              i18nKey={`${introKey}.shuttle`}
              t={t}
              components={{
                Link: (
                  <Inline
                    as="a"
                    className="min-h-11 min-w-11 underline underline-offset-4 decoration-brand-heading/40 hover:decoration-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-secondary"
                    href={SEA_HORSE_SHUTTLE_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                ),
              }}
            />
          </p>
          <Cluster as="div" className="mt-4">
            <a className={PRIMARY_BUTTON_CLASS} href={SEA_HORSE_SHUTTLE_URL} rel="noopener noreferrer" target="_blank">
              {t(`${introKey}.shuttleCta`, { defaultValue: "Book shuttle" })}
            </a>
          </Cluster>
          <p className="mt-3 text-sm text-brand-heading/80 dark:text-brand-text/80">
            {t(`${introKey}.shuttleBestFor`, {
              defaultValue: "Best for: airport arrivals · shared transfer · planning ahead",
            })}
          </p>
        </IntroHighlightCard>

        <IntroHighlightCard eyebrow={t(`${introKey}.helpEyebrow`, { defaultValue: "Need help?" })}>
          <p>
            {t(`${introKey}.helpCopy`, {
              defaultValue:
                "Arriving late or dealing with delays? Message us so we can plan your check-in and suggest a fallback route.",
            })}
          </p>
          <Cluster as="div" className="mt-4">
            <a className={PRIMARY_BUTTON_CLASS} href={emailHref}>
              {t(`${introKey}.emailCta`, { defaultValue: "Email reception" })}
            </a>
          </Cluster>
          <p className="mt-3 text-sm text-brand-heading/80 dark:text-brand-text/80">
            {t(`${introKey}.helpBestFor`, {
              defaultValue: "Best for: delays · ferry cancellations · late check-in",
            })}
          </p>
        </IntroHighlightCard>

        <IntroHighlightCard eyebrow={t(`${introKey}.tipsEyebrow`, { defaultValue: "Travel tips" })}>
          <Inline as="div" className="items-start gap-2">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-heading/70" />
            <ul className="list-none space-y-2 p-0 text-sm">
              <li>
                {t(`${introKey}.tipStairs`, {
                  defaultValue: "Positano has stairs everywhere — pack light!",
                })}
              </li>
              <li>
                {t(`${introKey}.tipFerries`, {
                  defaultValue: "Ferries can cancel due to weather. Check before you go.",
                })}
              </li>
            </ul>
          </Inline>
          <Cluster as="div" className="mt-4">
            <a className={ACTION_BUTTON_CLASS} href="#before-you-travel">
              {t(`${introKey}.tipsCta`, { defaultValue: "See all tips" })}
            </a>
          </Cluster>
        </IntroHighlightCard>
      </div>
    </div>
  );
}
