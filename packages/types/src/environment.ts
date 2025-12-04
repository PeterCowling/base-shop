export const ENVIRONMENTS = ["dev", "stage", "prod"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

