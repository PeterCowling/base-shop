import { z } from "zod";

export const segmentSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    filters: z.array(
      z.object({ field: z.string(), value: z.string() }).strict()
    ),
  })
  .strict();

export type Segment = z.infer<typeof segmentSchema>;
