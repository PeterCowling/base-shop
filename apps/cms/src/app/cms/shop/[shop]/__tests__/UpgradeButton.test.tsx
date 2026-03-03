// React 19 requires this flag to silence act warnings in tests
import { act,render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UpgradeButton from "@/app/cms/shop/[shop]/UpgradeButton";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  update: jest.fn(),
  promise: async <T,>(value: Promise<T>) => value,
};

const translations: Record<string, string> = {
  "cms.upgrade.prepare.title": "Prepare upgrade",
  "cms.upgrade.prepare.desc": "Upgrade storefront and preview the result.",
  "cms.upgrade.prepare.success": "Upgrade ready! Redirecting to preview…",
  "cms.upgrade.prepare.failed": "Upgrade failed",
  "cms.upgrade.preparing": "Preparing preview…",
  "cms.upgrade.previewCta": "Upgrade & preview",
  "cms.upgrade.viewSteps": "View steps",
  "cms.upgrade.stepsBackground": "Background steps",
};

jest.mock("@acme/ui/operations", () => ({
  __esModule: true,
  useToast: () => mockToast,
}));

jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

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
    expect(mockToast.success).toHaveBeenCalledWith(
      "Upgrade ready! Redirecting to preview…",
    );
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
    expect(mockToast.error).toHaveBeenCalledWith("msg");
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
    expect(mockToast.error).toHaveBeenCalledWith("Upgrade failed");
  });

  it("handles network errors", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("Network error"))
    );
    const button = setup();
    await click(button);
    expect(mockToast.error).toHaveBeenCalledWith("Network error");
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
    expect(mockToast.error).toHaveBeenCalledWith("fail");
    await waitFor(() => expect(button).toHaveTextContent(/Upgrade & preview/i));

    // Second click succeeds
    await act(async () => {
      userEvent.click(button);
    });
    await waitFor(() => expect(button).toHaveTextContent(/Preparing preview…/i));
    await act(async () => {});
    await waitFor(() => {
      expect(window.location.href).toBe(`/cms/shop/${shop}/upgrade-preview`);
    });
  });
});
