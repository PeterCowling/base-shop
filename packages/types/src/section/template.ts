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
  // Presentation presets (optional, used by renderer)
  contentWidth?: "full" | "wide" | "normal" | "narrow";
  density?: "compact" | "spacious";
  themeDark?: boolean;
  /** Opt-in minimal scroll animations */
  animateOnScroll?: boolean;
  // Optional: independent breakpoints for this template
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
  // Scheduling (optional; when present, worker flips published state accordingly)
  publishAt?: string; // ISO timestamp
  expireAt?: string; // ISO timestamp
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
    contentWidth: z.enum(["full", "wide", "normal", "narrow"]).optional(),
    density: z.enum(["compact", "spacious"]).optional(),
    themeDark: z.boolean().optional(),
    animateOnScroll: z.boolean().optional(),
    breakpoints: z
      .array(z.object({ id: z.string(), label: z.string(), min: z.number().optional(), max: z.number().optional() }).strict())
      .optional(),
    publishAt: z.string().optional(),
    expireAt: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
  })
  .strict();

export type { SectionTemplate as SectionTemplateType };

// Preset schema: reusable Section templates with optional locked keys
export interface SectionPreset {
  id: string;
  label: string;
  template: PageComponent;
  locked?: string[]; // property keys locked from editing
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const sectionPresetSchema: z.ZodType<SectionPreset, any, any> = z
  .object({
    id: z.string(),
    label: z.string().min(1),
    template: sectionLike,
    locked: z.array(z.string().min(1)).optional(),
    tags: z.array(z.string().min(1)).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
  })
  .strict();
