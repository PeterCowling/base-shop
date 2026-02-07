import "@testing-library/jest-dom";

import { renderHook, waitFor } from "@testing-library/react";

import useTerminalBatches from "../useTerminalBatches";

const originalFetch: typeof fetch = global.fetch;

function mockFetch<T>(data: T): typeof fetch {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response) as unknown as typeof fetch;
}

describe("useTerminalBatches", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns batches when data valid", async () => {
    const fetchMock = mockFetch([{ amount: 10 }]);
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const { result } = renderHook(() => useTerminalBatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.batches).toEqual([{ amount: 10 }]);
    expect(result.current.error).toBeNull();
  });

  it("reports error when terminal batch schema validation fails", async () => {
    const fetchMock = mockFetch([{ amount: "bad" }]);
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const { result } = renderHook(() => useTerminalBatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.batches).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });
});
