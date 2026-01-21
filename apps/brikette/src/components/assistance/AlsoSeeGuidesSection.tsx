// src/components/assistance/AlsoSeeGuidesSection.tsx
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import { Section } from "@acme/ui/atoms/Section";

import type { AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

function AlsoSeeGuidesSection({ lang }: { lang: AppLanguage }) {
  const { t: tGuides, i18n: guidesI18n } = useTranslation("guides", { lng: lang });
  const guidesEnT = (() => {
    const maybeFixed = typeof guidesI18n?.getFixedT === "function"
      ? guidesI18n.getFixedT("en", "guides")
      : undefined;
    return (typeof maybeFixed === "function" ? (maybeFixed as TFunction) : (tGuides as TFunction));
  })();

  return (
    <Section padding="none" width="full" className="mb-10 mt-2 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
        {tGuides("labels.alsoSee")}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        <li>
          <Link
            href={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "backpackerItineraries")}`}
            prefetch={true}
            className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
          >
            {getGuideLinkLabel(tGuides as TFunction, guidesEnT as TFunction, "backpackerItineraries")}
          </Link>
        </li>
        <li>
          <Link
            href={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "onlyHostel")}`}
            prefetch={true}
            className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
          >
            {getGuideLinkLabel(tGuides as TFunction, guidesEnT as TFunction, "onlyHostel")}
          </Link>
        </li>
      </ul>
    </Section>
  );
}

export default AlsoSeeGuidesSection;
