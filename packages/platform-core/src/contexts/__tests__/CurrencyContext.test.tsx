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

  it("uses default currency when window is undefined", async () => {
    jest.resetModules();
    const setSpy = jest.spyOn(Storage.prototype, "setItem");
    const originalWindow = global.window;
    // Remove the global window to simulate non-browser environment
    delete (global as any).window;
    expect(typeof window).toBe("undefined");

    const ReactTestRenderer = await import("react-test-renderer");
    const { default: TestRenderer, act: rendererAct } = ReactTestRenderer;

    const {
      CurrencyProvider: LocalCurrencyProvider,
      useCurrency: localUseCurrency,
    } = await import("../CurrencyContext");

    function LocalDisplay() {
      const [currency] = localUseCurrency();
      return <span data-cy="currency">{currency}</span>;
    }

    let renderer: any;
    await rendererAct(async () => {
      renderer = TestRenderer.create(
        <LocalCurrencyProvider>
          <LocalDisplay />
        </LocalCurrencyProvider>
      );
    });

    const currencyNode = renderer.root.findByProps({ "data-cy": "currency" });
    expect(currencyNode.children.join("")).toBe("EUR");
    expect(setSpy).not.toHaveBeenCalled();

    renderer.unmount();
    (global as any).window = originalWindow;
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
});

describe("useCurrency", () => {
  it("throws normalized error when called outside provider", () => {
    expect(() => useCurrency()).toThrow(
      "useCurrency must be inside CurrencyProvider"
    );
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

  it("rethrows errors from React.useContext", () => {
    const customError = new Error("useContext boom");
    const spy = jest.spyOn(React, "useContext").mockImplementation(() => {
      throw customError;
    });

    expect(() => useCurrency()).toThrow(customError);

    spy.mockRestore();
  });
});
