export interface ShopDelegate {
  findUnique: () => Promise<{ data: Record<string, unknown> }>;
}

export function createShopDelegate(): ShopDelegate {
  const delegate: ShopDelegate = {
    async findUnique() {
      return { data: {} };
    },
  };

  return delegate;
}
