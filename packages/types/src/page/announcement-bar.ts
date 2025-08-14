import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

export interface AnnouncementBarComponent extends PageComponentBase {
  type: "AnnouncementBar";
  text?: string;
  link?: string;
  closable?: boolean;
}

export const announcementBarComponentSchema = baseComponentSchema.extend({
  type: z.literal("AnnouncementBar"),
  text: z.string().optional(),
  link: z.string().optional(),
  closable: z.boolean().optional(),
});
