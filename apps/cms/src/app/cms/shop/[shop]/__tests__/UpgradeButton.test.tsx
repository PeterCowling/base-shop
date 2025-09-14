// React 19 requires this flag to silence act warnings in tests
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpgradeButton from "@/app/cms/shop/[shop]/UpgradeButton";

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
    return screen.getByRole("button");
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
    expect(await screen.findByRole("alert")).toHaveTextContent("msg");
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
    expect(await screen.findByRole("alert")).toHaveTextContent("Upgrade failed");
  });

  it("handles network errors", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("Network error"))
    );
    const button = setup();
    await click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
  });

  it("toggles loading and resets error between attempts", async () => {
    let rejectFetch: (reason?: any) => void;
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
    await waitFor(() => expect(button).toHaveTextContent(/Upgrading.../i));
    rejectFetch(new Error("fail"));
    await act(async () => {});
    expect(await screen.findByRole("alert")).toHaveTextContent("fail");
    await waitFor(() => expect(button).toHaveTextContent(/Upgrade & preview/i));

    // Second click succeeds
    await act(async () => {
      userEvent.click(button);
    });
    await waitFor(() => expect(button).toHaveTextContent(/Upgrading.../i));
    await act(async () => {});
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    await waitFor(() => {
      expect(window.location.href).toBe(`/cms/shop/${shop}/upgrade-preview`);
    });
  });
});
