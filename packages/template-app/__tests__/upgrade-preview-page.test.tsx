/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@ui/src/components/ComponentPreview", () => ({
  __esModule: true,
  default: ({ component }: any) => <div>{component.componentName}</div>,
}));

describe("UpgradePreviewPage", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("loads changes and links", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({
          components: [
            { file: "f.tsx", componentName: "Comp", oldChecksum: "1", newChecksum: "2" },
          ],
          pages: ["p1"],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ token: "tok" }),
      });

    const { default: Page } = await import("../src/app/upgrade-preview/page");
    render(<Page />);

    await waitFor(() => expect(screen.getByText("Comp")).toBeInTheDocument());
    expect(screen.getByText("/preview/p1")).toHaveAttribute(
      "href",
      "/preview/p1?upgrade=tok",
    );
  });

  it("shows error when publish fails", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ components: [], pages: [] }) })
      .mockResolvedValueOnce({ json: async () => ({ error: "fail" }) });

    const { default: Page } = await import("../src/app/upgrade-preview/page");
    render(<Page />);

    await userEvent.click(
      screen.getByRole("button", { name: "Approve & publish" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("fail");
  });
});
