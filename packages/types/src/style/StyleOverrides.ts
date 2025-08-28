import { z } from "zod";

export const styleOverridesSchema = z.object({
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  lineHeight: z.string().optional(),
});

export type StyleOverrides = z.infer<typeof styleOverridesSchema>;
