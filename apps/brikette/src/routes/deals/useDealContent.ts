import { useTranslation } from "react-i18next";

import type { AppLanguage } from "@/i18n.config";

import { DEALS_NAMESPACE } from "./constants";
import {
  buildPerksList,
  type PerkItem,
  resolvePerksHeading,
} from "./content";
import {
  createFallbackTranslator,
  createTokenResolver,
  type FallbackTranslator,
  type TokenResolver,
} from "./fallback";

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

  const translate =
    !ready && !readyEn ? createFallbackTranslator(tEn, tEn) : createFallbackTranslator(t, tEn);
  const resolveToken =
    !tokensReady && !tokensEnReady
      ? createTokenResolver(tTokensEn, tTokensEn)
      : createTokenResolver(tTokens, tTokensEn);

  const perks = !ready && !readyEn ? buildPerksList(tEn, tEn) : buildPerksList(t, tEn);
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
