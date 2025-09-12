import { renderHook, act, waitFor } from "@testing-library/react";
import { fetchJson } from "@acme/shared-utils";
import { usePublishLocations } from "./usePublishLocations";

jest.mock("@acme/shared-utils", () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

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
    await waitFor(() => expect(result.current.locations).toEqual(first));

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.locations).toEqual(second));

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.locations).toEqual(third));
  });

  it("handles duplicates", async () => {
    const base = [
      { id: "a", name: "A", path: "a", requiredOrientation: "landscape" },
    ];
    const duplicates = [base[0], base[0]];

    mockFetchJson.mockResolvedValueOnce(base).mockResolvedValueOnce(duplicates);

    const { result } = renderHook(() => usePublishLocations());
    await waitFor(() => expect(result.current.locations).toEqual(base));

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.locations).toEqual(duplicates));
  });
});
