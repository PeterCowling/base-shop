// src/data/guideImages.ts
// Maps guide keys to their specific thumbnail images
// Images sourced from Unsplash, stored locally in public/img/guides/topics/

import type { GuideKey } from "@/guides/slugs";

const GUIDE_IMAGES_BASE: Partial<Record<string, string>> = {
  // Beaches
  positanoBeaches: "/img/guides/topics/positanoBeaches.webp",
  positanoMainBeach: "/img/guides/topics/positanoMainBeach.jpg",
  marinaDiPraiaBeaches: "/img/guides/topics/marinaDiPraiaBeaches.webp",
  fiordoDiFuroreBeachGuide: "/img/guides/topics/fiordoDiFuroreBeachGuide.jpg",
  fornilloBeachGuide: "/img/guides/topics/fornilloBeachGuide.webp",
  lauritoBeachGuide: "/img/guides/topics/lauritoBeachGuide.jpg",
  gavitellaBeachGuide: "/img/guides/topics/gavitellaBeachGuide.jpg",
  arienzoBeachClub: "/img/guides/topics/arienzoBeachClub.jpg",
  reginaGiovannaBath: "/img/guides/topics/reginaGiovannaBath.webp",
  hostelBriketteToReginaGiovannaBath: "/img/guides/topics/hostelBriketteToReginaGiovannaBath.webp",
  hostelBriketteToFornilloBeach: "/img/guides/topics/hostelBriketteToFornilloBeach.jpg",
  hostelBriketteToFiordoDiFuroreBus: "/img/guides/topics/hostelBriketteToFiordoDiFuroreBus.jpg",

  // Hiking
  pathOfTheGods: "/img/guides/topics/pathOfTheGods.jpg",
  pathOfTheGodsFerry: "/img/guides/topics/pathOfTheGodsFerry.jpg",
  pathOfTheGodsBus: "/img/guides/topics/pathOfTheGodsBus.jpg",
  pathOfTheGodsNocelle: "/img/guides/topics/pathOfTheGodsNocelle.jpg",
  topOfTheMountainHike: "/img/guides/topics/topOfTheMountainHike.jpg",
  santaMariaDelCastelloHike: "/img/guides/topics/santaMariaDelCastelloHike.jpg",
  sunriseHike: "/img/guides/topics/sunriseHike.jpg",
  stayingFitAmalfi: "/img/guides/topics/stayingFitAmalfi.jpg",

  // Day trips
  capriDayTrip: "/img/guides/topics/capriDayTrip.jpg",
  positanoPompeii: "/img/guides/topics/positanoPompeii.jpg",
  dayTripsAmalfi: "/img/guides/topics/dayTripsAmalfi.jpg",
  capriOnABudget: "/img/guides/topics/capriOnABudget.jpg",

  // Boat
  boatTours: "/img/guides/topics/boatTours.jpg",

  // Cuisine
  cheapEats: "/img/guides/topics/cheapEats.jpg",
  eatingOutPositano: "/img/guides/topics/eatingOutPositano.jpg",
  limoncelloCuisine: "/img/guides/topics/limoncelloCuisine.jpg",
  positanoDining: "/img/guides/topics/positanoDining.jpg",

  // Photography/viewpoints
  sunsetViewpoints: "/img/guides/topics/sunsetViewpoints.jpg",
  instagramSpots: "/img/guides/topics/instagramSpots.jpg",
  terraceSunsets: "/img/guides/topics/terraceSunsets.webp",
};

export const GUIDE_IMAGES = GUIDE_IMAGES_BASE as Partial<Record<GuideKey, string>>;

/**
 * Get the image path for a guide, with fallback to topic image
 */
export function getGuideImage(guideKey: string, topicFallback?: string): string | undefined {
  return GUIDE_IMAGES[guideKey as GuideKey] ?? topicFallback;
}
