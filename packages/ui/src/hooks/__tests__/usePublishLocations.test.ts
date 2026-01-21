// i18n-exempt: Test descriptions and fixtures use literal strings
import { act, renderHook } from "@testing-library/react";

import {
  loadPublishLocations,
  usePublishLocations,
} from "@acme/platform-core/hooks/usePublishLocations";
import { fetchJson } from "@acme/lib/http";

jest.mock("@acme/lib/http", () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

afterEach(() => {
  jest.clearAllMocks();
});

// Avoid explicit any by narrowing global assignment
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const originalError = console.error;
let consoleErrorSpy: jest.SpyInstance | undefined;
beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((msg, ...args) => {
    if (typeof msg === "string" && msg.includes("not wrapped in act")) {
      return;
    }
    originalError(msg, ...args);
  });
});

afterAll(() => {
  consoleErrorSpy?.mockRestore();
});

describe("loadPublishLocations", () => {
  it("returns fetched data", async () => {
    const locations = [
      { id: "a", name: "A", path: "a", requiredOrientation: "landscape" },
    ];
    mockFetchJson.mockResolvedValueOnce(locations);
    await expect(loadPublishLocations()).resolves.toEqual(locations);
  });

  it("returns empty array on error", async () => {
    mockFetchJson.mockRejectedValueOnce(new Error("fail"));
    await expect(loadPublishLocations()).resolves.toEqual([]);
  });
});

describe("usePublishLocations", () => {
  it("loads and reloads locations", async () => {
    const first = [
      { id: "a", name: "A", path: "a", requiredOrientation: "landscape" },
    ];
    const second = [
      { id: "b", name: "B", path: "b", requiredOrientation: "portrait" },
    ];
    mockFetchJson.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const { result } = renderHook(() => usePublishLocations());
    await act(async () => {});
    expect(result.current.locations).toEqual(first);

    await act(async () => {
      result.current.reload();
    });
    expect(result.current.locations).toEqual(second);

    expect(mockFetchJson).toHaveBeenCalledTimes(2);
  });
});
