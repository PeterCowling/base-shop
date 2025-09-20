import { z } from "zod";

export const layoutSchema = z
  .object({
    gridCols: z.number().int().min(1).max(24).default(12),
    /** Optional custom breakpoints for this page (builder-only) */
    breakpoints: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          /** min width in px */
          min: z.number().int().nonnegative().optional(),
          /** max width in px */
          max: z.number().int().nonnegative().optional(),
        })
      )
      .default([]),
  })
  .strict()
  .default({ gridCols: 12, breakpoints: [] });
