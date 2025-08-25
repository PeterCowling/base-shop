import { z } from "zod";

export const environmentSettingsSchema = z.record(z.string());

export type EnvironmentSettings = z.infer<typeof environmentSettingsSchema>;
