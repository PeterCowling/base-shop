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
  "locker",
  "linen",
] as const;

export type FacilityKey = (typeof FACILITIES)[number];
