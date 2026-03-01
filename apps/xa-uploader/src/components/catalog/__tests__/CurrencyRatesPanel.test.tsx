/** @jest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

  it("shows load failure feedback when initial rates request fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ ok: false }),
      } as Response),
    ) as unknown as typeof fetch;

    render(
      <CurrencyRatesPanel
        busy={false}
        syncReadiness={{ checking: false, ready: true }}
        onSync={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("currency-rates-feedback")).toHaveTextContent("currencyRatesLoadFailed");
    });
  });

  it("calls onSync and shows synced note when save succeeds and sync is ready", async () => {
    const onSync = jest.fn();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response) as unknown as typeof fetch;

    render(
      <CurrencyRatesPanel
        busy={false}
        syncReadiness={{ checking: false, ready: true }}
        onSync={onSync}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("currency-rates-eur")).toHaveValue(0.93);
    });
    fireEvent.click(screen.getByTestId("currency-rates-save"));

    await waitFor(() => {
      expect(onSync).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("currency-rates-feedback")).toHaveTextContent("currencyRatesSyncedRebuildNote");
    });
  });

  it("shows saved-not-synced feedback and does not call onSync when readiness is false", async () => {
    const onSync = jest.fn();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response) as unknown as typeof fetch;

    render(
      <CurrencyRatesPanel
        busy={false}
        syncReadiness={{ checking: false, ready: false }}
        onSync={onSync}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("currency-rates-gbp")).toHaveValue(0.79);
    });
    fireEvent.click(screen.getByTestId("currency-rates-save"));

    await waitFor(() => {
      expect(onSync).not.toHaveBeenCalled();
      expect(screen.getByTestId("currency-rates-feedback")).toHaveTextContent("currencyRatesSavedSyncNotReady");
    });
  });

  it("shows save failure feedback when PUT fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } }),
      } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false }) } as Response) as unknown as typeof fetch;

    render(
      <CurrencyRatesPanel
        busy={false}
        syncReadiness={{ checking: false, ready: true }}
        onSync={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("currency-rates-aud")).toHaveValue(1.55);
    });
    fireEvent.click(screen.getByTestId("currency-rates-save"));

    await waitFor(() => {
      expect(screen.getByTestId("currency-rates-feedback")).toHaveTextContent("currencyRatesSaveFailed");
    });
  });
});
