import "@testing-library/jest-dom";

import React, { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";

import { RatesProvider, useRates } from "../RatesContext";

describe("RatesProvider lazy load", () => {
  beforeEach(() => {
    (globalThis as unknown as { fetch?: unknown }).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({}) as unknown,
    })) as unknown;
  });

  it("does not fetch on provider mount when no consumer uses rates", async () => {
    render(
      <RatesProvider>
        <div>no rates</div>
      </RatesProvider>,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("fetches once when a consumer calls useRates", async () => {
    function Consumer() {
      useRates();
      return null;
    }

    render(
      <RatesProvider>
        <Consumer />
      </RatesProvider>,
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    expect(globalThis.fetch).toHaveBeenCalledWith("/data/rates.json", { cache: "force-cache" });
  });

  it("multiple consumers still trigger a single fetch", async () => {
    function Consumer() {
      useRates();
      return null;
    }

    render(
      <RatesProvider>
        <Consumer />
        <Consumer />
      </RatesProvider>,
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
  });

  it("re-renders do not refetch once loaded", async () => {
    function Consumer() {
      const { loading } = useRates();
      useEffect(() => {
        // Ensure at least one re-render after the initial effect.
      }, [loading]);
      return null;
    }

    render(
      <RatesProvider>
        <Consumer />
      </RatesProvider>,
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    await Promise.resolve();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

