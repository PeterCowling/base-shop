/** @jest-environment node */
import { withEnv as baseWithEnv } from "./envTestUtils";

const baseEnv = {
  NODE_ENV: "test",
  CMS_SPACE_URL: "https://cms.example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "2024-01-01",
  SANITY_PROJECT_ID: "proj",
  SANITY_DATASET: "dataset",
} as NodeJS.ProcessEnv;

export async function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
): Promise<void> {
  await baseWithEnv({ ...baseEnv, ...vars }, fn);
}
