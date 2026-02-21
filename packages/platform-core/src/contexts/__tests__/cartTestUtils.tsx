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
  global.fetch = fetchMock as any;
  return {
    fetchMock,
    restore: () => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    },
  } as const;
}

export function mockNoWindow() {
  const originalWindow = global.window;
  (global as any).window = undefined;
  return () => {
    (global as any).window = originalWindow;
  };
}
