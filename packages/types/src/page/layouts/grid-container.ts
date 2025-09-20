import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";
import { pageComponentSchemaRef } from "./shared";

export interface GridContainerComponent extends PageComponentBase {
  type: "Grid";
  children?: PageComponent[];
  columns?: number; columnsDesktop?: number; columnsTablet?: number; columnsMobile?: number;
  rows?: number; rowsDesktop?: number; rowsTablet?: number; rowsMobile?: number;
  rowHeights?: string;
  areas?: string;
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
  gap?: string; gapDesktop?: string; gapTablet?: string; gapMobile?: string;
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItemsDesktop?: GridContainerComponent['justifyItems'];
  justifyItemsTablet?: GridContainerComponent['justifyItems'];
  justifyItemsMobile?: GridContainerComponent['justifyItems'];
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  alignItemsDesktop?: GridContainerComponent['alignItems'];
  alignItemsTablet?: GridContainerComponent['alignItems'];
  alignItemsMobile?: GridContainerComponent['alignItems'];
}

export const gridContainerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Grid"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  columns: z.number().optional(),
  columnsDesktop: z.number().optional(),
  columnsTablet: z.number().optional(),
  columnsMobile: z.number().optional(),
  rows: z.number().optional(),
  rowsDesktop: z.number().optional(),
  rowsTablet: z.number().optional(),
  rowsMobile: z.number().optional(),
  rowHeights: z.string().optional(),
  areas: z.string().optional(),
  autoFlow: z.enum(['row','column','dense','row dense','column dense']).optional(),
  gap: z.string().optional(),
  gapDesktop: z.string().optional(),
  gapTablet: z.string().optional(),
  gapMobile: z.string().optional(),
  justifyItems: z.enum(['start','center','end','stretch']).optional(),
  justifyItemsDesktop: z.enum(['start','center','end','stretch']).optional(),
  justifyItemsTablet: z.enum(['start','center','end','stretch']).optional(),
  justifyItemsMobile: z.enum(['start','center','end','stretch']).optional(),
  alignItems: z.enum(['start','center','end','stretch']).optional(),
  alignItemsDesktop: z.enum(['start','center','end','stretch']).optional(),
  alignItemsTablet: z.enum(['start','center','end','stretch']).optional(),
  alignItemsMobile: z.enum(['start','center','end','stretch']).optional(),
});

