import { renderHook, act, waitFor } from "@testing-library/react";
import { fetchJson } from "@acme/shared-utils";
import { usePublishLocations, loadPublishLocations } from "../usePublishLocations";

jest.mock("@acme/shared-utils", () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const originalError = console.error;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((msg, ...args) => {
    if (typeof msg === "string" && msg.includes("not wrapped in act")) {
      return;
    }
    originalError(msg, ...args);
  });
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("usePublishLocations", () => {
  it("returns default locations", () => {
    mockFetchJson.mockResolvedValueOnce([]);
    const { result } = renderHook(() => usePublishLocations());
    expect(result.current.locations).toEqual([]);
  });

  it("adding and removing locations updates state", async () => {
    const first = [
      { id: "a", name: "A", path: "a", requiredOrientation: "landscape" },
    ];
    const second = [
      ...first,
      { id: "b", name: "B", path: "b", requiredOrientation: "portrait" },
    ];
    const third = [second[1]];

    mockFetchJson
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
      .mockResolvedValueOnce(third);

    const { result } = renderHook(() => usePublishLocations());
    await act(async () => {});
    expect(result.current.locations).toEqual(first);

    await act(async () => {
      result.current.reload();
    });
    expect(result.current.locations).toEqual(second);

    await act(async () => {
      result.current.reload();
    });
    expect(result.current.locations).toEqual(third);
  });

  it("handles duplicates", async () => {
    const base = [
      { id: "a", name: "A", path: "a", requiredOrientation: "landscape" },
    ];
    const duplicates = [base[0], base[0]];

    mockFetchJson.mockResolvedValueOnce(base).mockResolvedValueOnce(duplicates);

    const { result } = renderHook(() => usePublishLocations());
    await act(async () => {});
    expect(result.current.locations).toEqual(base);

    await act(async () => {
      result.current.reload();
    });
    expect(result.current.locations).toEqual(duplicates);
  });
});

describe("loadPublishLocations", () => {
  it("returns fetched locations", async () => {
    const locations = [
      { id: "a", name: "A", path: "a", requiredOrientation: "landscape" },
    ];
    mockFetchJson.mockResolvedValueOnce(locations);
    await expect(loadPublishLocations()).resolves.toEqual(locations);
  });

  it("returns empty array on fetch error", async () => {
    mockFetchJson.mockRejectedValueOnce(new Error("fail"));
    await expect(loadPublishLocations()).resolves.toEqual([]);
  });
});
