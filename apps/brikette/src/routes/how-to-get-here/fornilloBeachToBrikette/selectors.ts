import type { GuideExtras } from "./types";

export function selectTocItems(extras: GuideExtras) {
  return extras.tocItems;
}

export function selectHowToSteps(extras: GuideExtras) {
  if (extras.howToSteps.length === 0) return null;
  return extras.howToSteps.map((name) => ({ name }));
}

