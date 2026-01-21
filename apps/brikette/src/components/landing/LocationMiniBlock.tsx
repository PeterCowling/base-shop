// src/components/landing/LocationMiniBlock.tsx
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

import { Grid, Section } from "@acme/ui/atoms";

import { CfImage } from "@/components/images/CfImage";
import { Cluster, Inline, Stack } from "@/components/ui/flex";
import hotel from "@/config/hotel";
import { useOptionalModal } from "@/context/ModalContext";
import type { AppLanguage } from "@/i18n.config";

/* i18n-exempt -- DX-453 [ttl=2026-12-31] Non-UI image asset reference. */
const MAP_IMAGE_SRC = "/img/positano-panorama.avif" as const;

const LocationMiniBlock = memo(function LocationMiniBlock({ lang }: { lang?: AppLanguage }): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t } = useTranslation("landingPage", translationOptions);
  const { t: tModals } = useTranslation("modals", translationOptions);
  const { openModal } = useOptionalModal();
  const address = t("heroSection.address");

  const mapsUrl = useMemo(() => {
    const { streetAddress, postalCode, addressLocality } = hotel.address;
    const query = `${streetAddress}, ${postalCode} ${addressLocality}`;
    return `https://www.google.com/maps/place/${encodeURIComponent(query)}`;
  }, []);

  const handleDirections = useCallback(() => {
    openModal("location", { hostelAddress: address });
  }, [address, openModal]);

  return (
    <section id="location" className="py-12 scroll-mt-24">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <Grid columns={{ base: 1, lg: 2 }} gap={6} className="lg:items-stretch">
          <Stack className="gap-4 rounded-3xl border border-brand-outline/30 bg-brand-bg p-6 shadow-sm dark:border-white/10 dark:bg-brand-surface">
            <div>
              <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">
                {t("locationSection.title")}
              </h2>
              <p className="mt-2 text-sm text-brand-text/70 dark:text-brand-surface/70">
                {t("locationSection.subtitle")}
              </p>
            </div>

            <Cluster className="text-xs font-medium text-brand-text/80 dark:text-brand-surface/80">
              <span className="rounded-full bg-brand-surface/70 px-3 py-1 dark:bg-white/10">
                {tModals("location.nearbyBusCompact")}
              </span>
              <span className="rounded-full bg-brand-surface/70 px-3 py-1 dark:bg-white/10">
                {t("locationSection.nearbyBeach")}
              </span>
            </Cluster>

            <p className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{address}</p>

            <Cluster className="mt-auto items-center gap-3">
              <button
                type="button"
                onClick={handleDirections}
                className="min-h-11 min-w-11 rounded-full bg-brand-secondary px-6 py-3 text-sm font-semibold text-brand-text shadow-md transition-colors hover:bg-brand-primary/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                {tModals("location.getDirections")}
              </button>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 min-w-11 rounded-full border border-brand-outline/50 px-6 py-3 text-sm font-semibold text-brand-heading transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:text-brand-surface"
              >
                {tModals("location.justShowMap")}
              </a>
            </Cluster>
          </Stack>

          <Stack
            as="a"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group h-full justify-between rounded-3xl border border-brand-outline/30 bg-brand-surface/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-brand-surface"
            aria-label={t("locationSection.mapLabel")}
          >
            <Inline className="gap-3 text-brand-heading dark:text-brand-surface">
              <Inline
                as="span"
                className="size-11 justify-center rounded-full bg-brand-bg text-brand-primary dark:bg-white/10"
              >
                <MapPin className="size-5" aria-hidden />
              </Inline>
              <div>
                <p className="text-sm font-semibold">{t("locationSection.mapLabel")}</p>
                <p className="text-xs text-brand-text/70 dark:text-brand-surface/70">
                  {t("locationSection.mapHint")}
                </p>
              </div>
            </Inline>
            <div className="hidden lg:block h-36 overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-bg/40 xl:h-44 dark:border-white/10">
              <CfImage
                src={MAP_IMAGE_SRC}
                preset="gallery"
                alt={t("locationSection.mapLabel")}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand-primary">
              {t("locationSection.mapCta")}
            </span>
          </Stack>
        </Grid>
      </Section>
    </section>
  );
});

export default LocationMiniBlock;
