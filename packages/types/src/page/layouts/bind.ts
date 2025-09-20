import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";
import type { PageComponent } from "../page";
import { pageComponentSchemaRef } from "./shared";

export interface BindComponent extends PageComponentBase {
  type: "Bind";
  children?: PageComponent[]; // expect a single child
  prop?: string;
  path?: string;
  fallback?: unknown;
}

export const bindComponentSchema = baseComponentSchema.extend({
  type: z.literal("Bind"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
  prop: z.string().optional(),
  path: z.string().optional(),
  fallback: z.unknown().optional(),
});

