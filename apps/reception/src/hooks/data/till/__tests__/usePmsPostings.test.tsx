import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import usePmsPostings from "../usePmsPostings";

const originalFetch: typeof fetch = global.fetch;

function mockFetch<T>(data: T): typeof fetch {
  return vi.fn(
    async () => ({ ok: true, json: async () => data } as Response)
  ) as unknown as typeof fetch;
}

describe("usePmsPostings", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns postings when data valid", async () => {
    const fetchMock = mockFetch([{ amount: 5, method: "CASH" }]);
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const { result } = renderHook(() => usePmsPostings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.postings).toEqual([{ amount: 5, method: "CASH" }]);
    expect(result.current.error).toBeNull();
  });

  it("reports error when PMS posting schema validation fails", async () => {
    const fetchMock = mockFetch([{ amount: "bad", method: "CASH" }]);
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const { result } = renderHook(() => usePmsPostings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.postings).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });
});
