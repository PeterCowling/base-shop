import { z } from "zod";

export const scaffoldSpecSchema = z
  .object({
    layout: z.enum(["default", "sidebar"]).default("default"),
    sections: z.array(z.string()).default([]),
    hero: z.string().optional(),
    cta: z.string().optional(),
  })
  .strict();

export type ScaffoldSpec = z.infer<typeof scaffoldSpecSchema>;
