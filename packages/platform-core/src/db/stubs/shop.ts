export function createShopDelegate() {
  const delegate = {
    findUnique: async () => ({ data: {} }),
  } as const;

  return delegate as any;
}
