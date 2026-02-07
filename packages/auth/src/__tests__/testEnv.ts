export const asProcessEnv = (
  env: Record<string, string | number | boolean | undefined>
): NodeJS.ProcessEnv =>
  ({ NODE_ENV: "test", ...env } as NodeJS.ProcessEnv);
