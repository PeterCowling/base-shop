/** @jest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import { CurrencyRatesPanel } from "../CurrencyRatesPanel.client";

jest.mock("../../../lib/uploaderI18n.client", () => ({
  useUploaderI18n: () => ({ t: (key: string) => key }),
}));

describe("CurrencyRatesPanel", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, rates: null }),
      } as Response),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders EUR, GBP, and AUD rate inputs", () => {
    render(
      <CurrencyRatesPanel
        busy={false}
        syncReadiness={{ checking: false, ready: true }}
        onSync={() => undefined}
      />,
    );

    expect(screen.getByTestId("currency-rates-eur")).toBeInTheDocument();
    expect(screen.getByTestId("currency-rates-gbp")).toBeInTheDocument();
    expect(screen.getByTestId("currency-rates-aud")).toBeInTheDocument();
  });

  it("save button is disabled when busy", () => {
    render(
      <CurrencyRatesPanel
        busy
        syncReadiness={{ checking: false, ready: true }}
        onSync={() => undefined}
      />,
    );

    expect(screen.getByTestId("currency-rates-save")).toBeDisabled();
  });
});
