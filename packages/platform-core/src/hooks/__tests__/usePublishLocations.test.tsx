// packages/platform-core/hooks/__tests__/usePublishLocations.test.tsx
jest.mock("@acme/shared-utils", () => ({
  fetchJson: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { usePublishLocations, loadPublishLocations } from "../usePublishLocations";
import { fetchJson } from "@acme/shared-utils";

afterEach(() => {
  jest.clearAllMocks();
});

describe("loadPublishLocations", () => {
  const locations = [
    {
      id: "a",
      name: "A",
      path: "a",
      requiredOrientation: "landscape",
    },
  ];

  it("returns fetched data", async () => {
    (fetchJson as jest.Mock).mockResolvedValueOnce(locations);
    await expect(loadPublishLocations()).resolves.toEqual(locations);
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
    {
      id: "c",
      name: "C",
      path: "c",
      requiredOrientation: "portrait",
    },
  ];

  it("loads locations, memoises them and reloads", async () => {
    const fetchJsonMock = fetchJson as jest.MockedFunction<typeof fetchJson>;
    fetchJsonMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    let hook: ReturnType<typeof usePublishLocations>;
    function TestComponent() {
      hook = usePublishLocations();
      return (
        <div>
          <span>{hook.locations.map((l) => l.name).join(",")}</span>
          <button onClick={() => hook.reload()} />
        </div>
      );
    }

    const { rerender } = render(<TestComponent />);

    await screen.findByText("A");
    expect(fetchJsonMock).toHaveBeenCalledTimes(1);

    const memoRef = hook.locations;
    rerender(<TestComponent />);
    expect(hook.locations).toBe(memoRef);

    fireEvent.click(screen.getByRole("button"));
    await screen.findByText("B,C");
    expect(fetchJsonMock).toHaveBeenCalledTimes(2);
    expect(hook.locations).not.toBe(memoRef);
  });

  it("returns an empty array when fetchJson throws", async () => {
    (fetchJson as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    function ErrorComponent() {
      const { locations } = usePublishLocations();
      return <span>{locations.length}</span>;
    }

    render(<ErrorComponent />);
    await screen.findByText("0");
  });
});

