// Central mock for @acme/config/env/shipping
export type TestShippingEnv = {
  TAXJAR_KEY?: string;
  UPS_KEY?: string;
  DHL_KEY?: string;
  SHIPPING_PROVIDER?: "none" | "external" | "shippo" | "ups" | "dhl";
  ALLOWED_COUNTRIES?: string[];
  LOCAL_PICKUP_ENABLED?: boolean;
  DEFAULT_COUNTRY?: string;
  DEFAULT_SHIPPING_ZONE?: "domestic" | "eu" | "international";
  FREE_SHIPPING_THRESHOLD?: number;
};

let overrides: Partial<TestShippingEnv> = Object.create(null);

export function __setShippingEnv(over: Partial<TestShippingEnv>): void {
  overrides = { ...overrides, ...over };
}

export function __resetShippingEnv(): void {
  overrides = Object.create(null);
}

function computeShippingEnv(): TestShippingEnv {
  const env: TestShippingEnv = {
    SHIPPING_PROVIDER: "none",
    ALLOWED_COUNTRIES: undefined,
    LOCAL_PICKUP_ENABLED: false,
    DEFAULT_COUNTRY: undefined,
    DEFAULT_SHIPPING_ZONE: undefined,
    FREE_SHIPPING_THRESHOLD: undefined,
  };
  return Object.assign(Object.create(null), env, overrides);
}

export function loadShippingEnv(): TestShippingEnv {
  return computeShippingEnv();
}

export const shippingEnv: TestShippingEnv = new Proxy({} as TestShippingEnv, {
  get: (_t, prop: string) => (computeShippingEnv() as any)[prop],
  has: (_t, prop: string) => prop in computeShippingEnv(),
  ownKeys: () => Reflect.ownKeys(computeShippingEnv()),
  getOwnPropertyDescriptor: (_t, prop: string | symbol) =>
    Object.getOwnPropertyDescriptor(computeShippingEnv(), prop),
});

export default {} as unknown as never;

