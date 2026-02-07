import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CountdownTimerComponent extends PageComponentBase {
  type: "CountdownTimer";
  targetDate?: string;
  timezone?: string;
  completionText?: string;
  styles?: string;
}

export const countdownTimerComponentSchema = baseComponentSchema.extend({
  type: z.literal("CountdownTimer"),
  targetDate: z.string().optional(),
  timezone: z.string().optional(),
  completionText: z.string().optional(),
  styles: z.string().optional(),
});

