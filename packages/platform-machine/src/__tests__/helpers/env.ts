export async function withEnv<T>(env: NodeJS.ProcessEnv, fn: () => Promise<T>): Promise<T> {
  const oldEnv = process.env;
  process.env = { ...oldEnv, EMAIL_FROM: "from@example.com", ...env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete (process.env as any)[key];
  }
  jest.resetModules();
  try {
    return await fn();
  } finally {
    process.env = oldEnv;
  }
}
