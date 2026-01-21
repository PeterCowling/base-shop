// packages/ui/src/organisms/ApartmentDetailsSection.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Check } from "lucide-react";

import { useModal } from "@acme/ui/context/ModalContext";
import { i18nConfig } from "@acme/ui/i18n.config";

import { Button } from "../atoms/Button";
import { Card, CardContent } from "../atoms/Card";
import { Heading } from "../atoms/Typography";
import { resolveBookingCtaLabel } from "../shared";

interface DetailsSectionProps {
  bookingUrl?: string;
  lang?: string;
}

function ApartmentDetailsSection({ bookingUrl, lang }: DetailsSectionProps): JSX.Element {
  const { t, ready } = useTranslation("apartmentPage", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { openModal } = useModal();
  const raw = t("detailsList", { returnObjects: true });
  const items = Array.isArray(raw) ? (raw as string[]) : [];

  const ctaLabel = useMemo(() => {
    if (!ready && !tokensReady) {
      return "Book Now";
    }
    return (
      resolveBookingCtaLabel(tTokens, {
        fallback: () => {
          const current = t("bookButton") as string;
          if (current && current.trim() && current !== "bookButton") {
            return current;
          }
          const fallback = t("bookButton", { lng: i18nConfig.fallbackLng }) as string;
          return fallback && fallback.trim() && fallback !== "bookButton" ? fallback : undefined;
        },
      }) ?? "Book Now"
    );
  }, [t, tTokens, ready, tokensReady]);

  return (
    <section aria-labelledby="details-heading" className="space-y-4">
      <Heading
        level={2}
        id={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] id attribute */ "details-heading"}
        className={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "text-brand-primary"}
      >
        {t("detailsHeading")}
      </Heading>
      <Card className="mx-auto text-start">
        <CardContent>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-start space-x-2">
                <Check size={18} className="mt-0.5 text-brand-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            {(() => {
              if (bookingUrl) {
                return (
                  <Button asChild className="cta-light dark:cta-dark">
                    {bookingUrl.startsWith("/") ? (
                      <Link href={bookingUrl}>{ctaLabel}</Link>
                    ) : (
                      <a href={bookingUrl}>{ctaLabel}</a>
                    )}
                  </Button>
                );
              }
              return (
                <Button onClick={() => openModal("booking")} className="cta-light dark:cta-dark">
                  {ctaLabel}
                </Button>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default memo(ApartmentDetailsSection);
export { ApartmentDetailsSection };
