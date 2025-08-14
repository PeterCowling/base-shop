import { coreEnv } from "@acme/config/env/core";

export const luxuryFeatures = {
  raTicketing: coreEnv.LUXURY_FEATURES_RA_TICKETING ?? false,
};
