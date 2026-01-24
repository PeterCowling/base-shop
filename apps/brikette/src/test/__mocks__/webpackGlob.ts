// Mock for @/utils/webpackGlob in Jest tests
// The real module uses import.meta which Jest CJS mode can't parse

export const supportsWebpackGlob = false;

export const getWebpackContext = () => {
  const ctx = ((_id: string) => undefined) as unknown as {
    keys: () => string[];
    (id: string): unknown;
  };
  ctx.keys = () => [];
  return ctx;
};

export const webpackContextToRecord = () => ({});
