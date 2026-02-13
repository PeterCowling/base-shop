/* eslint-disable ds/no-hardcoded-copy, ds/no-naked-img, ds/require-aspect-ratio-on-media -- BRIK-DS-001: in-progress design-system migration */
// src/components/landing/LocationMiniBlock.tsx
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";

import { Cluster, Inline, Stack } from "@/components/ui/flex";
import hotel from "@/config/hotel";
import { useOptionalModal } from "@/context/ModalContext";
import type { AppLanguage } from "@/i18n.config";
import { MapPin } from "@/icons";

const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}

const LocationMiniBlock = memo(function LocationMiniBlock({ lang }: { lang?: AppLanguage }): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t } = useTranslation("landingPage", translationOptions);
  const { t: tModals } = useTranslation("modals", translationOptions);
  const { openModal } = useOptionalModal();
  const address = resolveTranslatedCopy(
    t("heroSection.address", {
      defaultValue: "Via G. Marconi, 358, 84017 Positano SA",
    }),
    "Via G. Marconi, 358, 84017 Positano SA"
  );

  const { streetAddress, postalCode, addressLocality } = hotel.address;
  const mapsUrl = `https://www.google.com/maps/place/${encodeURIComponent(`${streetAddress}, ${postalCode} ${addressLocality}`)}`;

  const handleDirections = useCallback(() => {
    openModal("location", { hostelAddress: address });
  }, [address, openModal]);

  return (
    <section id="location" className="py-12 scroll-mt-24">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <Stack className="gap-4 rounded-3xl border border-brand-outline/30 bg-brand-bg p-6 shadow-sm border-fg-inverse/10 dark:bg-brand-surface">
            <div>
              <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-text">
                {resolveTranslatedCopy(
                  t("locationSection.title", { defaultValue: "Location & transport" }),
                  "Location & transport"
                )}
              </h2>
              <p className="mt-2 text-sm text-brand-text/70 dark:text-brand-text/70">
                {resolveTranslatedCopy(
                  t("locationSection.subtitle", {
                    defaultValue:
                      "Perched above Positano with quick access to buses, the beach, and ferries.",
                  }),
                  "Perched above Positano with quick access to buses, the beach, and ferries."
                )}
              </p>
            </div>

            <Cluster className="text-xs font-medium text-brand-text/80 dark:text-brand-text/80">
              <span className="rounded-full bg-brand-surface/70 px-3 py-1 bg-fg-inverse/10">
                {resolveTranslatedCopy(
                  tModals("location.nearbyBusCompact", { defaultValue: "100 m to SITA bus stop" }),
                  "100 m to SITA bus stop"
                )}
              </span>
              <span className="rounded-full bg-brand-surface/70 px-3 py-1 bg-fg-inverse/10">
                {resolveTranslatedCopy(
                  t("locationSection.nearbyBeach", { defaultValue: "≈350 m to the beach" }),
                  "≈350 m to the beach"
                )}
              </span>
            </Cluster>

            <p className="text-sm font-semibold text-brand-heading dark:text-brand-text">{address}</p>

            <Cluster className="mt-auto items-center gap-3">
              <button
                type="button"
                onClick={handleDirections}
                className="min-h-11 min-w-11 rounded-full bg-brand-secondary px-6 py-3 text-sm font-semibold text-brand-text shadow-md transition-colors hover:bg-brand-primary/90 hover:text-fg-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:text-brand-bg dark:hover:text-brand-bg"
              >
                {resolveTranslatedCopy(
                  tModals("location.getDirections", { defaultValue: "Get directions" }),
                  "Get directions"
                )}
              </button>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 min-w-11 rounded-full border border-brand-outline/50 px-6 py-3 text-sm font-semibold text-brand-heading transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary text-brand-surface dark:hover:text-brand-secondary"
              >
                {resolveTranslatedCopy(
                  tModals("location.justShowMap", { defaultValue: "Show map" }),
                  "Show map"
                )}
              </a>
            </Cluster>
          </Stack>

          <Stack
            as="a"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group h-full justify-between rounded-3xl border border-brand-outline/30 bg-brand-surface/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md border-fg-inverse/10 dark:bg-brand-surface"
          >
            <Inline className="gap-3 text-brand-heading dark:text-brand-text">
              <Inline
                as="span"
                className="size-11 justify-center rounded-full bg-brand-bg text-brand-primary bg-fg-inverse/10"
              >
                <MapPin className="size-5" aria-hidden />
              </Inline>
              <div>
                <p className="text-sm font-semibold">
                  {resolveTranslatedCopy(
                    t("locationSection.mapLabel", { defaultValue: "Open in Maps" }),
                    "Open in Maps"
                  )}
                </p>
                <p className="text-xs text-brand-text/70 dark:text-brand-text/70">
                  {resolveTranslatedCopy(
                    t("locationSection.mapHint", {
                      defaultValue: "Tap for a Google Maps pin and directions.",
                    }),
                    "Tap for a Google Maps pin and directions."
                  )}
                </p>
              </div>
            </Inline>
            <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-brand-outline/20">
              <img
                src="/img/hostel-coastal-horizon.webp"
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-overlay-scrim-1 via-transparent to-transparent">
                <div className="rounded-full bg-panel/90 p-2 shadow-lg dark:bg-brand-surface/90">
                  <MapPin className="size-5 text-brand-primary" aria-hidden />
                </div>
              </div>
            </div>
            <span className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand-primary dark:text-brand-secondary">
              {resolveTranslatedCopy(
                t("locationSection.mapCta", { defaultValue: "View map" }),
                "View map"
              )}
            </span>
          </Stack>
        </div>
      </Section>
    </section>
  );
});

export default LocationMiniBlock;
