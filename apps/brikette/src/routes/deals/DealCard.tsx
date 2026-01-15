import clsx from "clsx";
import { memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

import { Button } from "@acme/ui/atoms/Button";

import type { AppLanguage } from "@/i18n.config";
import { Cluster, Inline, Stack } from "@/components/ui/flex";

import type { DealConfig } from "./deals";
import { formatDateRange, formatMonthDay, formatPercent, isoDateToLocalStart, shouldIncludeYear } from "./dates";
import type { FallbackTranslator } from "./fallback";
import type { DealStatus } from "./status";

type DealCardProps = {
  deal: DealConfig;
  status: DealStatus;
  lang: AppLanguage;
  translate: FallbackTranslator;
  termsLabel: string;
  termsHref: string;
  onOpenBooking: (args: { kind: "deal" | "standard"; dealId?: string }) => void;
  referenceDate: Date;
};

function DealCard({
  deal,
  status,
  lang,
  translate,
  termsLabel,
  termsHref,
  onOpenBooking,
  referenceDate,
}: DealCardProps): JSX.Element {
  const startDate = useMemo(() => isoDateToLocalStart(deal.startDate), [deal.startDate]);
  const endDate = useMemo(() => isoDateToLocalStart(deal.endDate), [deal.endDate]);
  const includeYear = useMemo(
    () => shouldIncludeYear(referenceDate, startDate, endDate),
    [referenceDate, startDate, endDate],
  );
  const dateRange = useMemo(
    () => formatDateRange(lang, startDate, endDate, referenceDate),
    [lang, startDate, endDate, referenceDate],
  );
  const percentLabel = useMemo(() => formatPercent(lang, deal.discountPct), [deal.discountPct, lang]);
  const cardTitle = useMemo(
    () => translate("dealCard.savePercent", { percent: percentLabel }),
    [percentLabel, translate],
  );

  const startLabel = useMemo(
    () => formatMonthDay(lang, startDate, { includeYear }),
    [lang, startDate, includeYear],
  );
  const endLabel = useMemo(
    () => formatMonthDay(lang, endDate, { includeYear }),
    [lang, endDate, includeYear],
  );

  const primaryCta = useMemo(() => {
    if (status === "upcoming") return translate("dealCard.cta.applyDeal");
    if (status === "active") return translate("dealCard.cta.bookDirect");
    return null;
  }, [status, translate]);

  const statusLine = useMemo(() => {
    if (status === "upcoming") return translate("dealCard.status.upcoming", { startDate: startLabel });
    return null;
  }, [startLabel, status, translate]);
  const expiredMessage = useMemo(() => {
    if (status === "expired") return translate("expired.message", { endedOn: endLabel });
    return null;
  }, [endLabel, status, translate]);

  const badges = useMemo(() => {
    const out = [translate("dealCard.badges.autoApplied")];
    if (deal.rules.directOnly) {
      out.push(translate("dealCard.badges.directOnly"));
    }
    return out.filter((item) => item.trim().length > 0);
  }, [deal.rules.directOnly, translate]);

  const handleOpenDeal = useCallback(() => {
    onOpenBooking({ kind: "deal", dealId: deal.id });
  }, [deal.id, onOpenBooking]);

  return (
    <article className="space-y-4 rounded-2xl border border-brand-outline/30 bg-brand-bg p-6 text-start shadow-sm dark:bg-brand-text">
      <header className="space-y-2">
        <Stack className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-brand-heading">{cardTitle}</h3>
            <p className="text-sm text-brand-text/80">
              {translate("dealCard.stayDatesLabel")}{" "}
              <span className="whitespace-nowrap">{dateRange}</span>
            </p>
            {statusLine ? <p className="text-xs font-medium text-brand-text/70">{statusLine}</p> : null}
            {expiredMessage ? <p className="text-xs font-medium text-brand-text/70">{expiredMessage}</p> : null}
          </div>
          {status === "expired" ? (
            <Inline
              as="span"
              className={clsx(
                "w-fit",
                "rounded-full",
                "px-3",
                "py-1",
                "text-xs",
                "font-semibold",
                "bg-slate-100",
                "text-slate-900",
                "dark:bg-slate-500/20",
                "dark:text-slate-50"
              )}
            >
              {translate("dealCard.status.expired")}
            </Inline>
          ) : null}
        </Stack>
      </header>

      <Cluster>
        {badges.map((badge) => (
          <Inline
            as="span"
            key={badge}
            className={clsx(
              "rounded-full",
              "border",
              "border-brand-outline/30",
              "bg-brand-bg",
              "px-3",
              "py-1",
              "text-xs",
              "font-medium",
              "text-brand-heading",
              "dark:bg-brand-text"
            )}
          >
            {badge}
          </Inline>
        ))}
      </Cluster>

      <Stack className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        {primaryCta ? (
          <Button onClick={handleOpenDeal} className="cta-light dark:cta-dark">
            {primaryCta}
          </Button>
        ) : null}

        {termsLabel.trim().length > 0 ? (
          <Inline
            as={Link}
            to={termsHref}
            prefetch="intent"
            className="min-h-11 min-w-11 text-sm font-medium text-brand-primary underline-offset-4 hover:text-brand-bougainvillea focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            {termsLabel}
          </Inline>
        ) : null}
      </Stack>
    </article>
  );
}

export default memo(DealCard);
