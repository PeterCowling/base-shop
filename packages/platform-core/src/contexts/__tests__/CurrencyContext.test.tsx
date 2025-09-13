/** @jest-environment jsdom */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { CurrencyProvider, useCurrency, readInitial } from "../CurrencyContext";

// React 19 requires this flag for `act` to suppress environment warnings
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function Display() {
  const [currency, setCurrency] = useCurrency();
  return (
    <>
      <span data-cy="currency">{currency}</span>
      <button onClick={() => setCurrency("USD")}>change</button>
    </>
  );
}

describe("readInitial", () => {
  const LS_KEY = "PREFERRED_CURRENCY";

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it("returns default when window is undefined", () => {
    const originalWindow = global.window;
    (global as any).window = undefined;

    expect(readInitial()).toBe("EUR");

    (global as any).window = originalWindow;
  });

  it("returns stored currency when valid", () => {
    window.localStorage.setItem(LS_KEY, "USD");
    expect(readInitial()).toBe("USD");
  });

  it("defaults when stored currency is invalid", () => {
    window.localStorage.setItem(LS_KEY, "JPY");
    expect(readInitial()).toBe("EUR");
  });

  it("defaults when localStorage.getItem throws", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readInitial()).toBe("EUR");
  });
});

describe("CurrencyProvider", () => {
  const LS_KEY = "PREFERRED_CURRENCY";

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it("reads initial currency from localStorage when valid", () => {
    window.localStorage.setItem(LS_KEY, "USD");

    const { getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    expect(getByTestId("currency").textContent).toBe("USD");
    unmount();
  });

  it("falls back to default when localStorage has invalid value", () => {
    window.localStorage.setItem(LS_KEY, "JPY");

    const { getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    expect(getByTestId("currency").textContent).toBe("EUR");
    unmount();
  });

  it("falls back to default when localStorage access throws", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const { getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    expect(getByTestId("currency").textContent).toBe("EUR");
    unmount();
  });

  it("provides default and persists currency changes", async () => {
    const setSpy = jest.spyOn(Storage.prototype, "setItem");

    const { getByTestId, getByText, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    expect(getByTestId("currency").textContent).toBe("EUR");

    fireEvent.click(getByText("change"));

    await waitFor(() => {
      expect(getByTestId("currency").textContent).toBe("USD");
      expect(setSpy).toHaveBeenLastCalledWith(LS_KEY, "USD");
    });

    expect(window.localStorage.getItem(LS_KEY)).toBe("USD");

    unmount();
  });

  it("handles localStorage write failures", async () => {
    const setSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getByText, getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    fireEvent.click(getByText("change"));

    await waitFor(() => {
      expect(getByTestId("currency").textContent).toBe("USD");
      expect(setSpy).toHaveBeenCalledWith(LS_KEY, "USD");
    });

    expect(window.localStorage.getItem(LS_KEY)).toBeNull();

    consoleSpy.mockRestore();
    unmount();
  });
});

describe("useCurrency", () => {
  it("throws normalized error when called outside provider", () => {
    expect(() => useCurrency()).toThrow(
      "useCurrency must be inside CurrencyProvider"
    );
  });

  it("normalizes Invalid hook call errors", () => {
    const spy = jest.spyOn(React, "useContext").mockImplementation(() => {
      throw new Error("Invalid hook call");
    });

    expect(() => useCurrency()).toThrow(
      "useCurrency must be inside CurrencyProvider"
    );

    spy.mockRestore();
  });

  it("throws when a component uses the hook without provider", () => {
    function Bare() {
      useCurrency();
      return null;
    }

    expect(() => render(<Bare />)).toThrow(
      "useCurrency must be inside CurrencyProvider"
    );
  });

  it("rethrows unexpected errors from React.useContext", () => {
    const customError = new Error("useContext boom");
    const spy = jest.spyOn(React, "useContext").mockImplementation(() => {
      throw customError;
    });

    expect(() => useCurrency()).toThrow(customError);

    spy.mockRestore();
  });
});
