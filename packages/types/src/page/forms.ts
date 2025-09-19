import { z } from "zod";

export const formFieldOptionSchema = z
  .object({
    label: z.string(),
    value: z.string(),
  })
  .strict();

export type FormFieldOption = z.infer<typeof formFieldOptionSchema>;

export const formFieldSchema = z
  .object({
    type: z.enum(["text", "email", "select"]),
    name: z.string().optional(),
    label: z.string().optional(),
    options: z.array(formFieldOptionSchema).optional(),
  })
  .strict();

export type FormField = z.infer<typeof formFieldSchema>;

