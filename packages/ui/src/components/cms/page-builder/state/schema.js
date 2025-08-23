import { z } from "zod";
import { pageComponentSchema } from "@acme/types";
export const historyStateSchema = z
    .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
    gridCols: z.number().int().min(1).max(24).default(12),
})
    .strict()
    .default({ past: [], present: [], future: [], gridCols: 12 });
