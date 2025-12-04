// Minimal stub for Storybook CI to satisfy stories importing "@storybook/test".
// Provides no-op test helpers to keep the CI build compiling; local/dev Storybook
// should use the real package.

export const fn = <TArgs extends unknown[], TResult = unknown>(
  impl?: (...args: TArgs) => TResult,
) => {
   
  const mock: any = (...args: TArgs) => (impl ? impl(...args) : undefined);
  mock._isMockFunction = true;
  return mock as (...args: TArgs) => TResult;
};

export const expect =
   
  (globalThis as any).expect ??
  (() => {
    throw new Error('expect is not available in the Storybook CI stub');
  });

export const userEvent = {};
export const within = (..._args: unknown[]) => ({});
