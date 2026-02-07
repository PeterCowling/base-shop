import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface MapBlockComponent extends PageComponentBase {
  type: "MapBlock";
  lat?: number;
  lng?: number;
  zoom?: number;
}

export const mapBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("MapBlock"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().optional(),
});

