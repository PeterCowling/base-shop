import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";

import { pageComponentSchemaRef } from "./shared";

export interface StackFlexComponent extends PageComponentBase {
  type: "StackFlex";
  children?: PageComponent[];
  direction?: "row" | "column";
  directionDesktop?: "row" | "column";
  directionTablet?: "row" | "column";
  directionMobile?: "row" | "column";
  wrap?: boolean;
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  justifyDesktop?: StackFlexComponent["justify"];
  justifyTablet?: StackFlexComponent["justify"];
  justifyMobile?: StackFlexComponent["justify"];
  align?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  alignDesktop?: StackFlexComponent["align"];
  alignTablet?: StackFlexComponent["align"];
  alignMobile?: StackFlexComponent["align"];
}

export const stackFlexComponentSchema = baseComponentSchema.extend({
  type: z.literal("StackFlex"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  direction: z.enum(["row", "column"]).optional(),
  directionDesktop: z.enum(["row", "column"]).optional(),
  directionTablet: z.enum(["row", "column"]).optional(),
  directionMobile: z.enum(["row", "column"]).optional(),
  wrap: z.boolean().optional(),
  gap: z.string().optional(),
  gapDesktop: z.string().optional(),
  gapTablet: z.string().optional(),
  gapMobile: z.string().optional(),
  justify: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]).optional(),
  justifyDesktop: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]).optional(),
  justifyTablet: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]).optional(),
  justifyMobile: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]).optional(),
  align: z.enum(["stretch", "flex-start", "center", "flex-end", "baseline"]).optional(),
  alignDesktop: z.enum(["stretch", "flex-start", "center", "flex-end", "baseline"]).optional(),
  alignTablet: z.enum(["stretch", "flex-start", "center", "flex-end", "baseline"]).optional(),
  alignMobile: z.enum(["stretch", "flex-start", "center", "flex-end", "baseline"]).optional(),
});

