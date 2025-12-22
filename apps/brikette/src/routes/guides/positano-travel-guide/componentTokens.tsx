import { Link } from "react-router-dom";

import type { AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

import type { ComponentToken, FormattingToken, LinkComponentToken } from "./types";

export function buildComponents(
  lang: AppLanguage,
  componentTokens: ComponentToken[] | undefined,
): Record<string, JSX.Element> {
  if (!componentTokens || componentTokens.length === 0) {
    return {};
  }

  const guidesSlug = getSlug("guides", lang);

  const linkMap: Record<LinkComponentToken, JSX.Element> = {
    linkBestTime: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "bestTimeToVisit")}`} />,
    linkHowTo: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "howToGetToPositano")}`} />,
    linkNaples: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "naplesPositano")}`} />,
    linkSalerno: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "salernoPositano")}`} />,
    linkFerries: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "ferrySchedules")}`} />,
    linkBeaches: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "beaches")}`} />,
    linkPath: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "pathOfTheGods")}`} />,
    linkCapri: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "capriDayTrip")}`} />,
    linkAmalfi: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "positanoAmalfi")}`} />,
    linkRavello: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "positanoRavello")}`} />,
    linkCheapEats: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "cheapEats")}`} />,
    linkBudgetArrival: <Link to={`/${lang}/${guidesSlug}/${guideSlug(lang, "reachBudget")}`} />,
  } as const;

  const components: Record<string, JSX.Element> = {};

  const formattingComponents: Record<FormattingToken, JSX.Element> = {
    strong: <strong />,
    em: <em />,
  };

  const isFormattingToken = (token: ComponentToken): token is FormattingToken =>
    Object.prototype.hasOwnProperty.call(formattingComponents, token);

  const isLinkToken = (token: ComponentToken): token is LinkComponentToken =>
    Object.prototype.hasOwnProperty.call(linkMap, token);

  componentTokens.forEach((token) => {
    if (isFormattingToken(token)) {
      components[token] = formattingComponents[token];
      return;
    }

    if (isLinkToken(token)) {
      components[token] = linkMap[token];
    }
  });

  return components;
}
