jest.mock("@acme/shared-utils", () => ({
  fetchJson: jest.fn(),
}));

import { renderHook, act, waitFor } from "@testing-library/react";
import { fetchJson } from "@acme/shared-utils";
import { loadPublishLocations, usePublishLocations } from "../src/hooks/usePublishLocations";

afterEach(() => {
  jest.clearAllMocks();
});

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

describe("loadPublishLocations", () => {
  const sample = [
    {
      id: "a",
      name: "A",
      path: "a",
      requiredOrientation: "landscape",
    },
  ];

  it("returns fetched data", async () => {
    (fetchJson as jest.Mock).mockResolvedValueOnce(sample);
    await expect(loadPublishLocations()).resolves.toEqual(sample);
  });

  it("returns an empty array on failure", async () => {
    (fetchJson as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    await expect(loadPublishLocations()).resolves.toEqual([]);
  });
});

describe("usePublishLocations", () => {
  const first = [
    {
      id: "a",
      name: "A",
      path: "a",
      requiredOrientation: "landscape",
    },
  ];
  const second = [
    {
      id: "b",
      name: "B",
      path: "b",
      requiredOrientation: "landscape",
    },
  ];

  it("loads locations and reloads", async () => {
    const fetchJsonMock = fetchJson as jest.MockedFunction<typeof fetchJson>;
    fetchJsonMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const { result } = renderHook(() => usePublishLocations());

    await act(async () => {});
    expect(result.current.locations).toEqual(first);
    expect(fetchJsonMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.reload();
    });
    expect(result.current.locations).toEqual(second);
    expect(fetchJsonMock).toHaveBeenCalledTimes(2);
  });

  it("returns an empty array when fetch fails", async () => {
    (fetchJson as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => usePublishLocations());
    await act(async () => {});
    expect(result.current.locations).toEqual([]);
  });
});

