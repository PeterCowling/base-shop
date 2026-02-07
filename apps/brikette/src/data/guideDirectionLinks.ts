// src/data/guideDirectionLinks.ts
// Maps guide keys to their associated direction/travel links

import { type GuideKey,guideSlug } from "@/routes.guides-helpers";

export interface DirectionLink {
  slug: string;
  labelKey: string;
  label?: string;
  type?: 'guide' | 'howToGetHere'; // Defaults to 'guide'
}

/**
 * Direction links for guides - maps guide keys to related "how to get here" pages.
 * Labels are resolved via i18n at render time using the labelKey.
 */
export const GUIDE_DIRECTION_LINKS: Partial<Record<GuideKey, DirectionLink[]>> = {
  positanoMainBeach: [
    { slug: guideSlug('en', 'positanoMainBeachWalkDown'), labelKey: 'positanoMainBeachWalkDown', type: 'guide' },
    { slug: guideSlug('en', 'positanoMainBeachBusDown'), labelKey: 'positanoMainBeachBusDown', type: 'guide' },
    { slug: guideSlug('en', 'positanoMainBeachWalkBack'), labelKey: 'positanoMainBeachWalkBack', type: 'guide' },
    { slug: guideSlug('en', 'positanoMainBeachBusBack'), labelKey: 'positanoMainBeachBusBack', type: 'guide' },
  ],
  fornilloBeachGuide: [
    { slug: guideSlug('en', 'hostelBriketteToFornilloBeach'), labelKey: 'hostelBriketteToFornilloBeach', type: 'guide' },
    { slug: guideSlug('en', 'fornilloBeachToBrikette'), labelKey: 'fornilloBeachToBrikette', type: 'guide' },
  ],
  fiordoDiFuroreBeachGuide: [
    { slug: guideSlug('en', 'hostelBriketteToFiordoDiFuroreBus'), labelKey: 'hostelBriketteToFiordoDiFuroreBus', type: 'guide' },
    { slug: guideSlug('en', 'fiordoDiFuroreBusReturn'), labelKey: 'fiordoDiFuroreBusReturn', type: 'guide' },
  ],
  lauritoBeachGuide: [
    { slug: guideSlug('en', 'lauritoBeachBusDown'), labelKey: 'lauritoBeachBusDown', type: 'guide' },
    { slug: guideSlug('en', 'lauritoBeachBusBack'), labelKey: 'lauritoBeachBusBack', type: 'guide' },
  ],
  arienzoBeachClub: [
    { slug: guideSlug('en', 'hostelBriketteToArienzoBus'), labelKey: 'hostelBriketteToArienzoBus', type: 'guide' },
    { slug: guideSlug('en', 'arienzoBeachBusBack'), labelKey: 'arienzoBeachBusBack', type: 'guide' },
  ],
  reginaGiovannaBath: [
    { slug: guideSlug('en', 'hostelBriketteToReginaGiovannaBath'), labelKey: 'hostelBriketteToReginaGiovannaBath', type: 'guide' },
  ],
};
