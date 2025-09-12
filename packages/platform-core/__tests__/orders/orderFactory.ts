export const createOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "1",
  ...overrides,
});
