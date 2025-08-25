import { z } from "zod";

export const layoutSchema = z
  .object({
    gridCols: z.number().int().min(1).max(24).default(12),
  })
  .strict()
  .default({ gridCols: 12 });
