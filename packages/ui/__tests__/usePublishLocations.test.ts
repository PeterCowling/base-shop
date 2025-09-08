import { act, renderHook, waitFor } from "@testing-library/react";
import {
  usePublishLocations,
  loadPublishLocations,
} from "@platform-core/hooks/usePublishLocations";

jest.mock("@acme/shared-utils", () => ({
  fetchJson: jest.fn(),
}));

import { fetchJson } from "@acme/shared-utils";

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

afterEach(() => {
  jest.clearAllMocks();
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
    await waitFor(() => expect(result.current.locations).toEqual(first));

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.locations).toEqual(second));

    expect(mockFetchJson).toHaveBeenCalledTimes(2);
  });
});
