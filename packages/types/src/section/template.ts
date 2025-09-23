import { z } from "zod";
import { pageComponentSchema, type PageComponent } from "../page/page";

export type SectionStatus = "draft" | "published";

export interface SectionTemplate {
  id: string;
  label: string;
  status: SectionStatus;
  template: PageComponent; // root is expected to be a Section node
  tags?: string[];
  thumbnail?: string | null;
  // Optional: independent breakpoints for this template
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Ensure the template root looks like a Section via a lightweight refine
const sectionLike = pageComponentSchema.refine(
  (c) => (c as any)?.type === "Section",
  { message: "Template root must be a Section" }
);

export const sectionTemplateSchema: z.ZodType<SectionTemplate, any, any> = z
  .object({
    id: z.string(),
    label: z.string().min(1),
    status: z.enum(["draft", "published"]),
    template: sectionLike,
    tags: z.array(z.string().min(1)).optional(),
    thumbnail: z.string().url().nullable().optional(),
    breakpoints: z
      .array(z.object({ id: z.string(), label: z.string(), min: z.number().optional(), max: z.number().optional() }).strict())
      .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
  })
  .strict();

export type { SectionTemplate as SectionTemplateType };
