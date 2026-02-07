import type { GuideKey } from "./keys";

// Map specific guide keys to concrete component paths when they differ from
// the default `routes/guides/<slug>.tsx` inference.
export const GUIDE_COMPONENT_OVERRIDES: Partial<Record<GuideKey, string>> = {
  ravelloFestival: "routes/guides/ravello-music-festival.tsx",
  dayTripsAmalfi: "routes/guides/day-trips-from-positano.tsx",
  pathOfTheGods: "routes/guides/path-of-the-gods-from-brikette.tsx",
  pathOfTheGodsFerry: "routes/guides/path-of-the-gods-via-amalfi-ferry.tsx",
  pathOfTheGodsBus: "routes/guides/path-of-the-gods-via-amalfi-bus.tsx",
  pathOfTheGodsNocelle: "routes/guides/path-of-the-gods-via-nocelle.tsx",
  sunriseHike: "routes/guides/sunrise-hike-positano.tsx",
  offSeasonLongStay: "routes/guides/off-season-long-stay-tips.tsx",
  capriDayTrip: "routes/guides/day-trip-capri-from-positano.tsx",
  capriOnABudget: "routes/guides/capri-on-a-budget.tsx",
  naplesPositano: "routes/guides/naples-to-positano.tsx",
  salernoPositano: "routes/guides/salerno-to-positano.tsx",
  positanoRavello: "routes/guides/positano-to-ravello.tsx",
  positanoAmalfi: "routes/guides/positano-to-amalfi.tsx",
  simsAtms: "routes/guides/sim-esim-and-atms-positano.tsx",
  marinaDiPraiaBeaches: "routes/guides/marina-di-praia-and-secluded-beaches.tsx",
  arienzoBeachClub: "routes/guides/arienzo-beach-guide.tsx",
  reginaGiovannaBath: "routes/guides/regina-giovanna-bath-beach-guide.tsx",
  positanoMainBeachWalkDown: "routes/guides/walk-down-to-positano-main-beach.tsx",
  positanoMainBeachBusDown: "routes/guides/bus-down-to-positano-main-beach.tsx",
  positanoMainBeachWalkBack: "routes/guides/walk-back-to-hostel-brikette-from-positano-main-beach.tsx",
  positanoMainBeachBusBack: "routes/guides/bus-back-to-hostel-brikette-from-positano-main-beach.tsx",
  lauritoBeachBusDown: "routes/guides/getting-to-laurito-beach-by-bus.tsx",
  lauritoBeachBusBack: "routes/guides/bus-back-from-laurito-beach.tsx",
  hostelBriketteToArienzoBus: "routes/guides/bus-to-arienzo-beach.tsx",
  arienzoBeachBusBack: "routes/guides/bus-back-from-arienzo-beach.tsx",
  positanoPompeii: "routes/guides/positano-to-pompeii.tsx",
  hostelBriketteToFiordoDiFuroreBus: "routes/guides/hostel-brikette-to-fiordo-di-furore-by-bus.tsx",
  fiordoDiFuroreBusReturn: "routes/guides/fiordo-di-furore-bus-return.tsx",
  campingAmalfi: "routes/guides/camping-on-the-amalfi-coast.tsx",
  positanoWinterBudget: "routes/guides/positano-in-winter-on-a-budget.tsx",
  transportMoneySaving: "routes/guides/money-saving-tips-amalfi-coast-transport.tsx",
  workCafes: "routes/guides/wi-fi-and-work-cafes-positano.tsx",
  instagramSpots: "routes/guides/positano-instagram-spots.tsx",
  boatTours: "routes/guides/boat-tours-positano.tsx",
  walkingTourAudio: "routes/guides/free-walking-tour-audio-positano.tsx",
  eatingOutPositano: "routes/guides/eating-out-in-positano.tsx",
  positanoDining: "routes/guides/positano-dining-guide.tsx",
  limoncelloCuisine: "routes/guides/limoncello-and-local-cuisine.tsx",
  luminariaPraiano: "routes/guides/luminaria-di-san-domenico-praiano.tsx",
  salernoGatewayGuide: "routes/guides/salerno-amalfi-coast-gateway.tsx",
  groceriesPharmacies: "routes/guides/groceries-and-pharmacies-positano.tsx",
  cheapEats: "routes/guides/cheap-eats-in-positano.tsx",
  workAndTravelPositano: "routes/guides/work-and-travel-remote-work-positano.tsx",
  reachBudget: "routes/guides/how-to-reach-positano-on-a-budget.tsx",
  positanoBudget: "routes/guides/positano-on-a-budget.tsx",
  parking: "routes/guides/arriving-by-car.tsx",
  luggageStorage: "routes/guides/luggage-storage-positano.tsx",
  positanoCostComparison: "routes/guides/positano-cost-vs-other-beach-destinations.tsx",
  workExchangeItaly: "routes/guides/work-exchange-in-italian-hostels.tsx",
  stayingSafePositano: "routes/guides/staying-safe-positano-amalfi-coast.tsx",
  soloTravelPositano: "routes/guides/solo-travel-positano-tips.tsx",
  porterServices: "routes/guides/porter-service-positano.tsx",
  stayingFitAmalfi: "routes/guides/staying-fit-while-traveling-amalfi-coast.tsx",
  souvenirsAmalfi: "routes/guides/thrifty-souvenir-shopping-amalfi-coast.tsx",
  sunsetViewpoints: "routes/guides/sunset-viewpoints-positano.tsx",
  ferragostoPositano: "routes/guides/ferragosto-in-positano.tsx",
  chiesaNuovaArrivals: "routes/how-to-get-here/chiesa-nuova-bar-internazionale-to-hostel-brikette.tsx",
  chiesaNuovaDepartures: "routes/how-to-get-here/hostel-brikette-to-chiesa-nuova-bar-internazionale.tsx",
  ferryDockToBrikette: "routes/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage.tsx",
  briketteToFerryDock: "routes/how-to-get-here/hostel-brikette-to-ferry-dock-with-luggage.tsx",
  fornilloBeachToBrikette: "routes/how-to-get-here/fornillo-beach-to-hostel-brikette.tsx",
  whatToPack: "routes/guides/what-to-pack-amalfi-coast.tsx",
  tagsIndex: "routes/guides/tags.index.tsx",
};

const GUIDE_COMPONENT_OVERRIDE_KEYS = Object.keys(GUIDE_COMPONENT_OVERRIDES) as GuideKey[];

function slugFromOverridePath(pathname: string | undefined): string | undefined {
  if (!pathname) return undefined;
  const lastSegment = pathname.split("/").filter(Boolean).pop();
  if (!lastSegment) return undefined;
  return lastSegment.replace(/\.(?:mts|cts|tsx|ts|jsx|js)$/u, "");
}

export const GUIDE_SLUG_FALLBACKS: Partial<Record<GuideKey, string>> = Object.freeze(
  Object.fromEntries(
    GUIDE_COMPONENT_OVERRIDE_KEYS.map((key) => {
      const slug = slugFromOverridePath(GUIDE_COMPONENT_OVERRIDES[key]);
      return slug ? [key, slug] : null;
    }).filter((entry): entry is [GuideKey, string] => Array.isArray(entry)),
  ),
);
