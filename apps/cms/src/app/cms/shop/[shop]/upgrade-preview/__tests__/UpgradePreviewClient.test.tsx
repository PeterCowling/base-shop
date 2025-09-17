(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { act, render, screen, waitFor } from "@testing-library/react";
import UpgradePreviewClient from "../UpgradePreviewClient";

jest.mock("@ui/components/ComponentPreview", () => ({ component }: any) => (
  <div data-cy={`preview-${component.componentName}`}>{component.componentName}</div>
));

describe("UpgradePreviewClient", () => {
  const shop = "test-shop";
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("renders fetched component previews with summary", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        components: [
          {
            file: "a.tsx",
            componentName: "CompA",
            oldChecksum: "1",
            newChecksum: "2",
          },
          {
            file: "b.tsx",
            componentName: "CompB",
            oldChecksum: "3",
            newChecksum: "4",
          },
        ],
      }),
    });

    render(<UpgradePreviewClient shop={shop} />);

    expect(
      await screen.findByText("2 components ready for review.")
    ).toBeInTheDocument();
    expect(await screen.findByTestId("preview-CompA")).toBeInTheDocument();
    expect(await screen.findByTestId("preview-CompB")).toBeInTheDocument();
  });

  it("shows message when no components", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ components: [] }),
    });

    render(<UpgradePreviewClient shop={shop} />);

    expect(
      await screen.findByText("You're all caught up—no component updates detected.")
    ).toBeInTheDocument();
    expect(await screen.findByText("No changes to preview.")).toBeInTheDocument();
  });

  it("shows skeleton state while loading", async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ components: [] }),
            });
          }, 1000);
        })
    );

    render(<UpgradePreviewClient shop={shop} />);

    expect(screen.getAllByTestId("upgrade-skeleton")).toHaveLength(3);
    expect(screen.getByTestId("summary-skeleton")).toBeInTheDocument();

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("summary-skeleton")).toBeNull();
    });
    jest.useRealTimers();
  });

  it("logs error when fetch fails", async () => {
    const err = new Error("fail");
    (global.fetch as jest.Mock).mockRejectedValue(err);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<UpgradePreviewClient shop={shop} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(
        screen.getByText("We couldn't load the latest upgrade preview. Try again or refresh the page.")
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});

