import PlanChoice from "@/components/guides/PlanChoice";
import RelatedGuides from "@/components/guides/RelatedGuides";
import TagChips from "@/components/guides/TagChips";
import TransportNotice from "@/components/guides/TransportNotice";
import { shouldOmitRelatedGuidesLang } from "@/config/guide-overrides";
import type { AppLanguage } from "@/i18n.config";

import type { RelatedGuidesConfig } from "../types";

interface FooterWidgetsProps {
  lang: AppLanguage;
  guideKey: string;
  showTagChips?: boolean;
  showPlanChoice?: boolean;
  showTransportNotice?: boolean;
  relatedGuides?: RelatedGuidesConfig;
  tGuides: (
    k: string,
    opts?: { returnObjects?: boolean } & Record<string, unknown>
  ) => unknown;
}

export default function FooterWidgets({
  lang,
  guideKey,
  showTagChips,
  showPlanChoice,
  showTransportNotice,
  relatedGuides,
  tGuides,
}: FooterWidgetsProps): JSX.Element {
  const omitRelatedGuidesLang = shouldOmitRelatedGuidesLang(guideKey);
  const planTitle = (() => {
    try {
      const raw = tGuides(`content.${guideKey}.planChoiceTitle`) as unknown;
      if (typeof raw === 'string') {
        const v = raw.trim();
        if (v && v !== `content.${guideKey}.planChoiceTitle`) return v;
      }
    } catch {
      void 0;
    }
    return undefined;
  })();

  return (
    <>
      {showTagChips ? <TagChips /> : null}
      {showPlanChoice ? (
        <PlanChoice {...(typeof planTitle === "string" ? { title: planTitle } : {})} />
      ) : null}
      {showTransportNotice ? <TransportNotice /> : null}
      {relatedGuides ? (
        // For the beach-hopping route, tests expect RelatedGuides to be
        // invoked without an explicit lang prop (component should derive it
        // internally). Keep passing lang for all other routes.
        omitRelatedGuidesLang ? (
          <RelatedGuides {...relatedGuides} />
        ) : (
          <RelatedGuides lang={lang} {...relatedGuides} />
        )
      ) : null}
    </>
  );
}
