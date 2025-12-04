import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

const { useRouter } = require("next/router");

const originalFetch = global.fetch;
let Upgrade: typeof import("../src/pages/Upgrade").default;

describe("Upgrade page", () => {
  beforeEach(async () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { id: "shop1" } });
    global.fetch = jest.fn();
    ({ default: Upgrade } = await import("../src/pages/Upgrade"));
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
    global.fetch = originalFetch;
  });

  it("publishes upgrade successfully", async () => {
    (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
      const [url] = args as [string];
      if (url === "/api/shop/shop1/component-diff") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            core: [
              { file: "CompA.tsx", componentName: "CompA", newChecksum: "1" },
              { file: "CompB.tsx", componentName: "CompB", newChecksum: "2" },
            ],
          }),
        });
      }
      if (url === "/api/shop/shop1/publish-upgrade") {
        return Promise.resolve({
          ok: true,
          text: async () => "",
        });
      }
      return Promise.resolve({
        ok: false,
        text: async () => "",
      });
    });

    render(<Upgrade />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/shop/shop1/component-diff",
      expect.objectContaining({ signal: expect.anything() })
    );

    await screen.findByText("core");

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/Select CompA/i));

    await user.click(screen.getByRole("button", { name: /publish/i }));
    await user.click(screen.getByRole("button", { name: /publish now/i }));
    await screen.findByText("Publish complete");
  });

  it("hides selections and publish button when nothing is selected", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        core: [
          { file: "CompA.tsx", componentName: "CompA", newChecksum: "1" },
          { file: "CompB.tsx", componentName: "CompB", newChecksum: "2" },
        ],
      }),
    });

    render(<Upgrade />);

    await screen.findByText("core");

    expect(screen.queryByText("Selected components")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /publish/i })
    ).not.toBeInTheDocument();
  });

  it("shows error message when publish fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
      const [url] = args as [string];
      if (url === "/api/shop/shop1/component-diff") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            core: [
              { file: "CompA.tsx", componentName: "CompA", newChecksum: "1" },
              { file: "CompB.tsx", componentName: "CompB", newChecksum: "2" },
            ],
          }),
        });
      }
      if (url === "/api/shop/shop1/publish-upgrade") {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: false,
                text: async () => "publish failed",
              }),
            50
          )
        );
      }
      return Promise.resolve({
        ok: false,
        text: async () => "",
      });
    });

    render(<Upgrade />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/shop/shop1/component-diff",
      expect.objectContaining({ signal: expect.anything() })
    );

    await screen.findByText("core");

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/Select CompA/i));
    expect(screen.getAllByText("CompA.tsx")[0]).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Select CompA/i));
    expect(
      screen.queryByText("Selected components")
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/Select CompA/i));
    expect(screen.getAllByText("CompA.tsx")[0]).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /publish/i });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: /publish now/i }));

    await screen.findByText("Publishing...");

    await waitFor(() =>
      expect(screen.getAllByText(/Publish failed/i).length).toBeGreaterThan(0)
    );
    errorSpy.mockRestore();
  });

  it("handles component diff fetch failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "fail",
    });

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Upgrade />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "We couldn't load the latest upgrade preview.",
        expect.any(Error)
      );
    });

    await screen.findByText("We couldn't load the latest upgrade preview.");

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it("does not fetch when shop id is missing", () => {
    (useRouter as jest.Mock).mockReturnValue({ query: {} });

    render(<Upgrade />);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /publish/i })
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no component updates", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ core: [] }),
    });

    render(<Upgrade />);

    await screen.findByText("You're all caught up—no component updates detected.");
    expect(screen.queryByRole("button", { name: /publish/i })).not.toBeInTheDocument();
  });

  it("resets selections when the shop id changes", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/shop/shop1/component-diff")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            core: [
              { file: "CompA.tsx", componentName: "CompA", newChecksum: "1" },
            ],
          }),
        });
      }
      if (url.includes("/api/shop/shop2/component-diff")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            core: [
              { file: "CompC.tsx", componentName: "CompC", newChecksum: "3" },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const { rerender } = render(<Upgrade />);

    await screen.findByText("core");
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/Select CompA/i));
    expect(screen.getAllByText("CompA.tsx")[0]).toBeInTheDocument();

    (useRouter as jest.Mock).mockReturnValue({ query: { id: "shop2" } });
    rerender(<Upgrade />);

    await screen.findByText("CompC");
    expect(
      screen.queryByText("Selected components")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("CompA.tsx")).not.toBeInTheDocument();
  });
});

it("restores global.fetch after tests", () => {
  expect(global.fetch).toBe(originalFetch);
});
