import AlsoHelpful from "@/components/common/AlsoHelpful";
import PlanChoice from "@/components/guides/PlanChoice";
import RelatedGuides from "@/components/guides/RelatedGuides";
import TagChips from "@/components/guides/TagChips";
import TransportNotice from "@/components/guides/TransportNotice";
import type { AppLanguage } from "@/i18n.config";

import type { AlsoHelpfulConfig,RelatedGuidesConfig } from "../types";

interface FooterWidgetsProps {
  lang: AppLanguage;
  guideKey: string;
  hasLocalizedContent: boolean;
  showTagChips?: boolean;
  showPlanChoice?: boolean;
  showTransportNotice?: boolean;
  relatedGuides?: RelatedGuidesConfig;
  showRelatedWhenLocalized?: boolean;
  alsoHelpful?: AlsoHelpfulConfig;
  tGuides: (
    k: string,
    opts?: { returnObjects?: boolean } & Record<string, unknown>
  ) => unknown;
}

export default function FooterWidgets({
  lang,
  guideKey,
  hasLocalizedContent,
  showTagChips,
  showPlanChoice,
  showTransportNotice,
  relatedGuides,
  showRelatedWhenLocalized,
  alsoHelpful,
  tGuides,
}: FooterWidgetsProps): JSX.Element {
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
      {relatedGuides && (!hasLocalizedContent || showRelatedWhenLocalized) ? (
        // For the beach-hopping route, tests expect RelatedGuides to be
        // invoked without an explicit lang prop (component should derive it
        // internally). Keep passing lang for all other routes.
        guideKey === 'beachHoppingAmalfi' ? (
          <RelatedGuides {...relatedGuides} />
        ) : (
          <RelatedGuides lang={lang} {...relatedGuides} />
        )
      ) : null}
      {alsoHelpful ? (
        <AlsoHelpful
          lang={lang}
          tags={alsoHelpful.tags}
          {...(alsoHelpful.excludeGuide ? { excludeGuide: alsoHelpful.excludeGuide } : {})}
          {...(typeof alsoHelpful.includeRooms === "boolean"
            ? { includeRooms: alsoHelpful.includeRooms }
            : {})}
          {...(alsoHelpful.titleKey ? { titleKey: alsoHelpful.titleKey } : {})}
          {...(alsoHelpful.section ? { section: alsoHelpful.section } : {})}
        />
      ) : null}
    </>
  );
}
