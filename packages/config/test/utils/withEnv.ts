export async function withEnv<T>(
  vars: NodeJS.ProcessEnv,
  loader: () => Promise<T>,
): Promise<T> {
  const OLD = process.env;
  jest.resetModules();
  process.env = { ...OLD, ...vars };
  if (!("NODE_ENV" in vars)) {
    delete process.env.NODE_ENV;
  }
  try {
    return await loader();
  } finally {
    process.env = OLD;
  }
}
