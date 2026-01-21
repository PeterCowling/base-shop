// file path: src/locales/guides.stub/content/index.ts
// -----------------------------------------------------------------------------
// Aggregator for single-purpose guide content stubs. Keeps original
// `export const content` shape for consumers.
// -----------------------------------------------------------------------------

import { stubFaq } from "../shared";

import { arienzoBeachBusBack } from "./arienzoBeachBusBack";
import { backpackerItineraries } from "./backpackerItineraries";
import { backpackingSouthernItaly } from "./backpackingSouthernItaly";
import { beachHoppingAmalfi } from "./beachHoppingAmalfi";
import { bestTimeToVisit } from "./bestTimeToVisit";
import { boatTours } from "./boatTours";
import { budgetAccommodationBeyond } from "./budgetAccommodationBeyond";
import { capriDayTrip } from "./capriDayTrip";
import { cheapEats } from "./cheapEats";
import { chiesaNuovaArrivals } from "./chiesaNuovaArrivals";
import { cookingClassesAmalfi } from "./cookingClassesAmalfi";
import { ecoFriendlyAmalfi } from "./ecoFriendlyAmalfi";
import { ferryDockToBrikette } from "./ferryDockToBrikette";
import { ferrySchedules } from "./ferrySchedules";
import { hostelToFerryDock } from "./hostelToFerryDock";
import { lauritoBeachBusBack } from "./lauritoBeachBusBack";
import { onlyHostel } from "./onlyHostel";
// Compose the legacy `content` structure expected by the stub bundle
import { parking } from "./parking";
import { pathOfTheGods } from "./pathOfTheGods";
import { porterService } from "./porterService";
import { positanoBudget } from "./positanoBudget";
import { reachBudget } from "./reachBudget";
import { travelInsuranceAmalfi } from "./travelInsuranceAmalfi";

export const content = {
  parking,
  onlyHostel,
  reachBudget,
  ferrySchedules,
  pathOfTheGods,
  chiesaNuovaArrivals,
  hostelToFerryDock,
  ferryDockToBrikette,
  // Alias used by tests manipulating the guides namespace directly
  briketteToFerryDock: hostelToFerryDock,
  backpackingSouthernItaly,
  beachHoppingAmalfi,
  cheapEats,
  backpackerItineraries,
  bestTimeToVisit,
  boatTours,
  ecoFriendlyAmalfi,
  budgetAccommodationBeyond,
  positanoBudget,
  porterService,
  capriDayTrip,
  arienzoBeachBusBack,
  lauritoBeachBusBack,

  // Minimal FAQ stubs needed for machine-layer tests when bundles are empty
  freeThingsPositano: stubFaq,
  ravelloFestival: stubFaq,
  ferragostoPositano: stubFaq,
  transportBudget: stubFaq,
  offSeasonLongStay: stubFaq,
  positanoWinterBudget: stubFaq,
  positanoCostBreakdown: stubFaq,
  positanoCostComparison: stubFaq,
  travelInsuranceAmalfi,
  walkingTourAudio: stubFaq,
  workExchangeItaly: stubFaq,
  stayingFitAmalfi: stubFaq,
  luminariaPraiano: stubFaq,
  artisansPositanoShopping: stubFaq,
  cookingClassesAmalfi,
  cuisineAmalfiGuide: stubFaq,
  etiquetteItalyAmalfi: stubFaq,
  folkloreAmalfi: stubFaq,
  historyPositano: stubFaq,
  limoncelloFactory: stubFaq,
  petsAmalfi: stubFaq,
  photographyGuidePositano: stubFaq,
} as const;

 
