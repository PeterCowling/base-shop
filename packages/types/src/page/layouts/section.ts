import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";
import { pageComponentSchemaRef } from "./shared";

export interface SectionComponent extends PageComponentBase {
  type: "Section";
  children?: PageComponent[];
  /** Optional per-section grid column count for editor snapping */
  gridCols?: number;
  /** Optional per-section grid gutter (px/rem) for editor overlay */
  gridGutter?: string;
  /** Optional per-section toggle: enable grid snapping for children */
  gridSnap?: boolean;
  /** Background image URL */
  backgroundImageUrl?: string;
  /** Background image focal point (0..1) */
  backgroundFocalPoint?: { x: number; y: number };
  /** Background size */
  backgroundSize?: 'cover' | 'contain' | 'auto';
  /** Background repeat */
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  /** Background attachment */
  backgroundAttachment?: 'scroll' | 'fixed' | 'local';
  /** Optional overlay (e.g., rgba or gradient) */
  backgroundOverlay?: string;
  /** Background video URL */
  backgroundVideoUrl?: string;
  /** Background video poster */
  backgroundVideoPoster?: string;
  /** Background video loop flag */
  backgroundVideoLoop?: boolean;
  /** Background video mute flag */
  backgroundVideoMuted?: boolean;
  /** Parallax factor applied to Section container */
  sectionParallax?: number;
}

export const sectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("Section"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  gridCols: z.number().int().min(1).max(24).optional(),
  gridGutter: z.string().optional(),
  gridSnap: z.boolean().optional(),
  backgroundImageUrl: z.string().optional(),
  backgroundFocalPoint: z.object({ x: z.number(), y: z.number() }).optional(),
  backgroundSize: z.enum(['cover','contain','auto']).optional(),
  backgroundRepeat: z.enum(['no-repeat','repeat','repeat-x','repeat-y']).optional(),
  backgroundAttachment: z.enum(['scroll','fixed','local']).optional(),
  backgroundOverlay: z.string().optional(),
  backgroundVideoUrl: z.string().optional(),
  backgroundVideoPoster: z.string().optional(),
  backgroundVideoLoop: z.boolean().optional(),
  backgroundVideoMuted: z.boolean().optional(),
  sectionParallax: z.number().optional(),
});
