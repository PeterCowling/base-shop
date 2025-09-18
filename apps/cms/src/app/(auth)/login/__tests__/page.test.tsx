import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import LoginPage from "../page";

type ServiceWorkerContainerLike = Pick<ServiceWorkerContainer, "getRegistrations">;

const loginFormPropsSpy = jest.fn();

jest.mock("../LoginForm", () => ({
  __esModule: true,
  default: (props: { fallbackUrl: string }) => {
    loginFormPropsSpy(props);
    return <div data-cy="login-form-stub">Mock Login Form</div>;
  },
}));

const overrideServiceWorker = (
  implementation: ServiceWorkerContainerLike | undefined,
): (() => void) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.navigator,
    "serviceWorker",
  );

  if (implementation === undefined) {
    try {
      delete (window.navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
    } catch {
      Object.defineProperty(window.navigator, "serviceWorker", {
        configurable: true,
        value: undefined,
      });
    }
  } else {
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: implementation,
    });
  }

  return () => {
    if (descriptor) {
      Object.defineProperty(window.navigator, "serviceWorker", descriptor);
    } else {
      try {
        delete (window.navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
      } catch {
        Object.defineProperty(window.navigator, "serviceWorker", {
          configurable: true,
          value: undefined,
        });
      }
    }
  };
};

describe("LoginPage", () => {
  let restoreServiceWorker: (() => void) | undefined;

  beforeEach(() => {
    loginFormPropsSpy.mockClear();
  });

  afterEach(() => {
    restoreServiceWorker?.();
    restoreServiceWorker = undefined;
    jest.clearAllMocks();
  });

  it("unregisters existing service workers and renders the form", async () => {
    const unregisterOne = jest.fn();
    const unregisterTwo = jest.fn();
    const getRegistrations = jest.fn().mockResolvedValue([
      { unregister: unregisterOne },
      { unregister: unregisterTwo },
    ]);

    restoreServiceWorker = overrideServiceWorker({ getRegistrations });

    render(<LoginPage />);

    await waitFor(() => {
      expect(unregisterOne).toHaveBeenCalled();
      expect(unregisterTwo).toHaveBeenCalled();
    });

    expect(getRegistrations).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("login-form-stub")).toBeInTheDocument();
    expect(loginFormPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fallbackUrl: "/cms" }),
    );
  });

  it("handles service worker cleanup errors without interrupting rendering", async () => {
    const getRegistrations = jest
      .fn()
      .mockRejectedValue(new Error("failed to enumerate"));

    restoreServiceWorker = overrideServiceWorker({ getRegistrations });

    render(<LoginPage />);

    await waitFor(() => expect(getRegistrations).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("login-form-stub")).toBeInTheDocument();
    expect(loginFormPropsSpy).toHaveBeenCalled();
  });

  it("does not throw when service workers are unsupported", () => {
    restoreServiceWorker = overrideServiceWorker(undefined);

    expect(() => {
      render(<LoginPage />);
    }).not.toThrow();

    expect(screen.getByTestId("login-form-stub")).toBeInTheDocument();
    expect(loginFormPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fallbackUrl: "/cms" }),
    );
  });
});
