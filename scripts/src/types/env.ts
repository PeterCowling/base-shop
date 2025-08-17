import { z } from "zod";

/**
 * CLI env variables required by CMS migration scripts.
 * Both are required and must be non-empty strings.
 */
export const CliEnvSchema = z.object({
  CMS_SPACE_URL: z.string().trim().min(1, "CMS_SPACE_URL is required"),
  CMS_ACCESS_TOKEN: z.string().trim().min(1, "CMS_ACCESS_TOKEN is required"),
});

export type CliEnv = z.infer<typeof CliEnvSchema>;
