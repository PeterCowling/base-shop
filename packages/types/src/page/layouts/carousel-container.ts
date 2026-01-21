import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";

import { pageComponentSchemaRef } from "./shared";

export interface CarouselContainerComponent extends PageComponentBase {
  type: "CarouselContainer";
  children?: PageComponent[];
  slidesPerView?: number; slidesPerViewDesktop?: number; slidesPerViewTablet?: number; slidesPerViewMobile?: number;
  gap?: string; gapDesktop?: string; gapTablet?: string; gapMobile?: string;
  showArrows?: boolean; showDots?: boolean;
}

export const carouselContainerComponentSchema = baseComponentSchema.extend({
  type: z.literal("CarouselContainer"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  slidesPerView: z.number().optional(),
  slidesPerViewDesktop: z.number().optional(),
  slidesPerViewTablet: z.number().optional(),
  slidesPerViewMobile: z.number().optional(),
  gap: z.string().optional(),
  gapDesktop: z.string().optional(),
  gapTablet: z.string().optional(),
  gapMobile: z.string().optional(),
  showArrows: z.boolean().optional(),
  showDots: z.boolean().optional(),
});

