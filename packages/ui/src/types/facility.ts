export const FACILITIES = [
  "privateRoom",
  "mixedDorm",
  "femaleDorm",
  "doubleBed",
  "singleBeds",
  "bathroomEnsuite",
  "bathroomShared",
  "seaView",
  "gardenView",
  "airCon",
  "keycard",
  "linen",
] as const;

export type FacilityKey = (typeof FACILITIES)[number];
