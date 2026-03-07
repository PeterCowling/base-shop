import "@testing-library/jest-dom";

import { act, render, waitFor } from "@testing-library/react";

import { ServiceWorkerRegistration } from "../ServiceWorkerRegistration";

const originalNodeEnv = process.env.NODE_ENV;
const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker",
);

function restoreServiceWorkerDescriptor(): void {
  if (originalServiceWorkerDescriptor) {
    Object.defineProperty(navigator, "serviceWorker", originalServiceWorkerDescriptor);
    return;
  }

  Reflect.deleteProperty(navigator, "serviceWorker");
}

describe("ServiceWorkerRegistration", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    restoreServiceWorkerDescriptor();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("skips registration outside production", () => {
    process.env.NODE_ENV = "development";
    const registerMock = jest.fn();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register: registerMock },
    });

    render(<ServiceWorkerRegistration />);

    expect(registerMock).not.toHaveBeenCalled();
  });

  it("registers in production and clears update interval on unmount", async () => {
    process.env.NODE_ENV = "production";
    jest.useFakeTimers();

    const updateMock = jest.fn().mockResolvedValue(undefined);
    const registerMock = jest.fn().mockResolvedValue({ update: updateMock });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register: registerMock },
    });

    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<ServiceWorkerRegistration />);

    await waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith("/sw.js", { updateViaCache: "none" }),
    );

    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000);
    });
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("no-ops when service workers are unavailable", () => {
    process.env.NODE_ENV = "production";
    Reflect.deleteProperty(navigator, "serviceWorker");

    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });
});
