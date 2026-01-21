// React 19 requires this flag to silence act warnings in tests
import { act,render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UpgradeButton from "@/app/cms/shop/[shop]/UpgradeButton";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("UpgradeButton", () => {
  const shop = "test-shop";
  let originalFetch: typeof fetch;
  let originalLocation: Location;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    originalFetch = global.fetch;
    const mock = jest.fn() as any;
    global.fetch = mock;
    Object.defineProperty(window, "fetch", { value: mock, writable: true });
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, href: "" },
      writable: true,
    });
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation((msg) => {
        if (typeof msg === "string" && msg.includes("act(")) {
          return;
        }
      });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(window, "fetch", { value: originalFetch, writable: true });
    Object.defineProperty(window, "location", { value: originalLocation });
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  function setup() {
    render(<UpgradeButton shop={shop} />);
    return screen.getByRole("button", { name: /upgrade & preview/i });
  }

  async function click(button: HTMLElement) {
    await act(async () => {
      await userEvent.click(button);
    });
    await act(async () => {});
  }

  it("redirects on successful upgrade", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: true })
    );
    const button = setup();
    await click(button);
    expect(await screen.findByText(/Upgrade ready! Redirecting to preview…/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.href).toBe(`/cms/shop/${shop}/upgrade-preview`);
    });
  });

  it("shows server error message", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "msg" }),
      })
    );
    const button = setup();
    await click(button);
    expect(await screen.findByText("msg")).toBeInTheDocument();
  });

  it("shows default error when server lacks message", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      })
    );
    const button = setup();
    await click(button);
    expect(await screen.findByText("Upgrade failed")).toBeInTheDocument();
  });

  it("handles network errors", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("Network error"))
    );
    const button = setup();
    await click(button);
    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("toggles loading and resets error between attempts", async () => {
    let rejectFetch: (reason?: any) => void = () => {};
    (global.fetch as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFetch = reject;
          })
      )
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    const button = setup();

    // First click fails
    await act(async () => {
      userEvent.click(button);
    });
    await waitFor(() => expect(button).toHaveTextContent(/Preparing preview…/i));
    rejectFetch(new Error("fail"));
    await act(async () => {});
    expect(await screen.findByText("fail")).toBeInTheDocument();
    await waitFor(() => expect(button).toHaveTextContent(/Upgrade & preview/i));

    // Second click succeeds
    await act(async () => {
      userEvent.click(button);
    });
    await waitFor(() => expect(button).toHaveTextContent(/Preparing preview…/i));
    await act(async () => {});
    await waitFor(() => expect(screen.queryByText("fail")).toBeNull());
    await waitFor(() => {
      expect(window.location.href).toBe(`/cms/shop/${shop}/upgrade-preview`);
    });
  });
});
