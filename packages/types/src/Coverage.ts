import { z } from "zod";

/** Mishap codes that can optionally be covered. */
export const COVERAGE_CODES = ["scuff", "tear", "lost"] as const;
export type CoverageCode = (typeof COVERAGE_CODES)[number];

/**
 * Mapping of coverage codes to either a fixed fee or the string "deposit".
 * The latter indicates that the item's deposit should be charged instead of a
 * flat fee.
 */
export const coverageSchema = z.record(
  z.enum(COVERAGE_CODES),
  z.union([z.number(), z.literal("deposit")])
);

export type CoverageMatrix = z.infer<typeof coverageSchema>;
