import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AppLanguage } from "@/i18n.config";

import {
  createFallbackTranslator,
  createTokenResolver,
  type TokenResolver,
  type FallbackTranslator,
} from "./fallback";
import {
  buildPerksList,
  resolvePerksHeading,
  type PerkItem,
} from "./content";
import { DEALS_NAMESPACE } from "./constants";

export interface DealsPageLabels {
  perksHeading: string;
  perksIntro: string;
  perksGuarantee: string;
  perksLinkLabel: string;
  termsLabel: string;
  checkAvailabilityLabel: string;
}

export interface DealsPageContent {
  translate: FallbackTranslator;
  resolveToken: TokenResolver;
  perks: PerkItem[];
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
  const directBookingPerksLabel = resolveToken("directBookingPerks");
  const perksHeading = resolvePerksHeading(directBookingPerksLabel, translate);
  const perksIntro = translate("perksIntro");
  const perksGuarantee = translate("perksGuarantee");
  const perksLinkLabel = translate("perksIntroLink");
  const termsLabel = translate("restrictions.other");
  const checkAvailabilityLabel = resolveToken("checkAvailability");

  return {
    translate,
    resolveToken,
    perks,
    labels: {
      perksHeading,
      perksIntro,
      perksGuarantee,
      perksLinkLabel,
      termsLabel,
      checkAvailabilityLabel,
    },
  };
}
