import { act, renderHook, waitFor } from "@testing-library/react";
import {
  usePublishLocations,
  loadPublishLocations,
} from "@acme/platform-core/hooks/usePublishLocations";

jest.mock("@acme/shared-utils", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@acme/shared-utils";

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

afterEach(() => {
  jest.clearAllMocks();
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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
