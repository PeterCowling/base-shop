import { useCart } from "../CartContext";

export function CartDisplay() {
  const [cart] = useCart();
  return <span data-testid="count">{Object.keys(cart).length}</span>;
}

export function clearCartStorage() {
  window.localStorage.clear();
}

export function setupFetchMock() {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  // @ts-expect-error override
  global.fetch = fetchMock;
  return {
    fetchMock,
    restore: () => {
      // @ts-expect-error restore
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    },
  } as const;
}

export function mockNoWindow() {
  const originalWindow = global.window;
  // @ts-expect-error override
  (global as any).window = undefined;
  return () => {
    // @ts-expect-error restore
    (global as any).window = originalWindow;
  };
}
