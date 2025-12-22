import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AppLanguage } from "@/i18n.config";
import formatDisplayDate from "@/utils/formatDisplayDate";

import { DEAL_END, DEAL_VALIDITY } from "./constants";
import {
  createFallbackTranslator,
  createTokenResolver,
  type FallbackTranslator,
} from "./fallback";
import {
  buildPerksList,
  buildRestrictions,
  resolveActiveCtaLabel,
  resolveExpiredCtaLabel,
  resolvePerksHeading,
} from "./content";
import { DEALS_NAMESPACE } from "./constants";

export interface DealsPageLabels {
  seasonLabel: string;
  perksHeading: string;
  perksIntro: string;
  perksGuarantee: string;
  termsLabel: string;
  expiredRobotsDirective: string;
  expiredCtaLabel: string;
  activeCtaLabel: string;
}

export interface DealsPageContent {
  translate: FallbackTranslator;
  perks: string[];
  restrictions: string[];
  isExpired: boolean;
  validityFrom: string;
  validityTo: string;
  labels: DealsPageLabels;
}

export function useDealContent(lang: AppLanguage): DealsPageContent {
  const { t, ready } = useTranslation(DEALS_NAMESPACE, { lng: lang });
  const { t: tEn, ready: readyEn } = useTranslation(DEALS_NAMESPACE, { lng: "en" });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { t: tTokensEn, ready: tokensEnReady } = useTranslation("_tokens", { lng: "en" });

  const translate = useMemo(() => {
    if (!ready && !readyEn) {
      return createFallbackTranslator(tEn, tEn);
    }
    return createFallbackTranslator(t, tEn);
  }, [t, tEn, ready, readyEn]);
  const resolveToken = useMemo(() => {
    if (!tokensReady && !tokensEnReady) {
      return createTokenResolver(tTokensEn, tTokensEn);
    }
    return createTokenResolver(tTokens, tTokensEn);
  }, [tTokens, tTokensEn, tokensReady, tokensEnReady]);

  const perks = useMemo(() => {
    if (!ready && !readyEn) {
      return buildPerksList(tEn, tEn);
    }
    return buildPerksList(t, tEn);
  }, [t, tEn, ready, readyEn]);
  const restrictions = useMemo(() => buildRestrictions(translate), [translate]);

  const isExpired = Date.now() > DEAL_END.getTime();
  const validityFrom = formatDisplayDate(lang, DEAL_VALIDITY.start);
  const validityTo = formatDisplayDate(lang, DEAL_VALIDITY.end);
  const seasonLabel = translate("seasonLabel");
  const directBookingPerksLabel = resolveToken("directBookingPerks");
  const perksHeading = resolvePerksHeading(directBookingPerksLabel, translate);
  const perksIntro = translate("perksIntro");
  const perksGuarantee = translate("perksGuarantee");
  const termsLabel = translate("restrictions.other");
  const checkAvailabilityLabel = resolveToken("checkAvailability");
  const reserveLabel = resolveToken("reserveNow");
  const bookLabel = resolveToken("bookNow");
  const expiredRobotsDirective = translate("robots.expiredNoindex");
  const expiredCtaLabel = resolveExpiredCtaLabel(
    checkAvailabilityLabel,
    reserveLabel,
    bookLabel,
    translate
  );
  const activeCtaLabel = resolveActiveCtaLabel(reserveLabel, bookLabel, translate);

  return {
    translate,
    perks,
    restrictions,
    isExpired,
    validityFrom,
    validityTo,
    labels: {
      seasonLabel,
      perksHeading,
      perksIntro,
      perksGuarantee,
      termsLabel,
      expiredRobotsDirective,
      expiredCtaLabel,
      activeCtaLabel,
    },
  };
}
