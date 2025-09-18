export async function withEnv<T>(
  vars: NodeJS.ProcessEnv,
  loader: () => Promise<T>,
): Promise<T> {
  const OLD = process.env;
  jest.resetModules();
  const nextEnv: NodeJS.ProcessEnv = { ...OLD, ...vars };
  const hasEmailFrom =
    typeof nextEnv.EMAIL_FROM === "string" && nextEnv.EMAIL_FROM.trim().length > 0;
  if (!("EMAIL_FROM" in vars) && !hasEmailFrom) {
    nextEnv.EMAIL_FROM = "from@example.com";
  }
  process.env = nextEnv;
  if (!("NODE_ENV" in vars)) {
    delete process.env.NODE_ENV;
  }
  try {
    return await loader();
  } finally {
    process.env = OLD;
  }
}
