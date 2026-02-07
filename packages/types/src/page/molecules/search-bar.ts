import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface SearchBarComponent extends PageComponentBase {
  type: "SearchBar";
  placeholder?: string;
  limit?: number;
}

export const searchBarComponentSchema = baseComponentSchema.extend({
  type: z.literal("SearchBar"),
  placeholder: z.string().optional(),
  limit: z.number().optional(),
});

