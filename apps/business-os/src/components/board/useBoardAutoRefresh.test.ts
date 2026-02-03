/**
 * useBoardAutoRefresh Hook Tests
 * BOS-D1-07: Cursor-based polling for board changes
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";

import { useBoardAutoRefresh } from "./useBoardAutoRefresh";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

const STORAGE_KEY = "bos-board-changes-cursor:BRIK";

function createResponse(status: number, payload: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe("useBoardAutoRefresh", () => {
  beforeEach(() => {
    refresh.mockClear();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it("TC-01: initial load uses cursor=0 and stores latest cursor", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, {
        cursor: 5,
        changes: { cards: [], ideas: [], stage_docs: [] },
      })
    );

    const { unmount } = renderHook(() =>
      useBoardAutoRefresh({ businessCode: "BRIK", pollingInterval: 10000 })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/board-changes?cursor=0&business=BRIK"
      );
    });

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("5");
    });
    unmount();
  });

  it("TC-02: incremental poll uses stored cursor", async () => {
    window.localStorage.setItem(STORAGE_KEY, "100");

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, {
        cursor: 101,
        changes: { cards: [], ideas: [], stage_docs: [] },
      })
    );

    const { unmount } = renderHook(() =>
      useBoardAutoRefresh({ businessCode: "BRIK", pollingInterval: 10000 })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/board-changes?cursor=100&business=BRIK"
      );
    });
    unmount();
  });

  it("TC-03: cursor persisted across refresh", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, {
        cursor: 42,
        changes: { cards: [], ideas: [], stage_docs: [] },
      })
    );

    const { unmount } = renderHook(() =>
      useBoardAutoRefresh({ businessCode: "BRIK", pollingInterval: 10000 })
    );

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("42");
    });
    unmount();
  });

  it("TC-04: incremental change triggers refresh", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(200, {
        cursor: 7,
        changes: { cards: [{ ID: "BRIK-001" }], ideas: [], stage_docs: [] },
      })
    );

    const { unmount } = renderHook(() =>
      useBoardAutoRefresh({ businessCode: "BRIK", pollingInterval: 10000 })
    );

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    unmount();
  });

  it("TC-05: stale cursor resets and triggers refresh", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse(410, {
        cursor: 12,
      })
    );

    const { unmount } = renderHook(() =>
      useBoardAutoRefresh({ businessCode: "BRIK", pollingInterval: 10000 })
    );

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    unmount();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("12");
  });
});
