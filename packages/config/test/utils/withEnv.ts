export async function withEnv<T>(
  vars: NodeJS.ProcessEnv,
  loader: () => Promise<T>,
): Promise<T> {
  const OLD = process.env;
  jest.resetModules();
  process.env = { ...OLD, ...vars };
  try {
    return await loader();
  } finally {
    process.env = OLD;
  }
}
