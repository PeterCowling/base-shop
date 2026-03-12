import "@testing-library/jest-dom";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import OctorateCustomPageShell from "@/components/booking/OctorateCustomPageShell";
import { buildOctorateUrl } from "@/utils/buildOctorateUrl";

const COPY = {
  labels: {
    continue: "Continue to secure booking",
    fallbackBody: "If the embedded booking step is unavailable, use the direct Octorate link.",
    fallbackTitle: "Direct booking link ready",
    heading: "Secure your booking",
    loading: "Loading secure booking step...",
    ready: "Secure booking step loaded.",
    security: "You remain on the Brikette domain until the secure booking tool finishes loading.",
    step: "Step 3 of 3",
    supporting: "Review your stay, then continue into the secure booking engine.",
    widgetHost: "Secure booking widget host",
  },
  summaryLabels: {
    checkin: "Check-in",
    checkout: "Check-out",
    guests: "Guests",
    rate: "Rate",
    room: "Room",
  },
} as const;

type WindowGlobals = Record<string, unknown>;

function getWindowGlobals(): WindowGlobals {
  return window as unknown as WindowGlobals;
}

function triggerScriptEvent(src: string, eventName: "load" | "error"): HTMLScriptElement {
  const script = document.querySelector(`script[src="${src}"]`);
  if (!(script instanceof HTMLScriptElement)) {
    throw new Error(`Expected script element for ${src}`);
  }
  script.dispatchEvent(new Event(eventName));
  return script;
}

function getDirectUrl(): string {
  const result = buildOctorateUrl({
    bookingCode: "45111",
    checkin: "2026-06-16",
    checkout: "2026-06-18",
    octorateRateCode: "433887",
    pax: 2,
    plan: "nr",
    roomSku: "room_10",
  });

  if (!result.ok) {
    throw new Error(`Expected buildOctorateUrl to succeed, received ${result.error}`);
  }

  return result.url;
}

describe("OctorateCustomPageShell", () => {
  beforeEach(() => {
    window.history.replaceState(
      {},
      "",
      "/en/book/secure-booking?checkin=2026-06-16&checkout=2026-06-18&pax=2&room=room_10",
    );
  });

  it("passes same-origin host context and booking payload into the mocked bootstrap", async () => {
    const bootstrap = jest.fn(() => undefined);
    const directUrl = getDirectUrl();

    render(
      <OctorateCustomPageShell
        {...COPY}
        directUrl={directUrl}
        summary={{
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          ratePlanLabel: "Non-refundable",
          roomName: "10 Bed Mixed Dorm",
        }}
        widgetBootstrap={bootstrap}
      />,
    );

    await waitFor(() => expect(bootstrap).toHaveBeenCalledTimes(1));

    expect(bootstrap).toHaveBeenCalledWith(
      expect.objectContaining({
        directUrl,
        hostPageUrl: expect.stringContaining(
          "/en/book/secure-booking?checkin=2026-06-16&checkout=2026-06-18&pax=2&room=room_10",
        ),
        summary: expect.objectContaining({
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          ratePlanLabel: "Non-refundable",
          roomName: "10 Bed Mixed Dorm",
        }),
      }),
    );
    expect(screen.getByLabelText(COPY.labels.widgetHost)).toBeInTheDocument();
    expect(screen.getByText(COPY.labels.ready)).toBeInTheDocument();
    expect(window.location.pathname).toBe("/en/book/secure-booking");
  });

  it("falls back to the direct Octorate URL when the mocked bootstrap fails", async () => {
    const directUrl = getDirectUrl();

    render(
      <OctorateCustomPageShell
        {...COPY}
        directUrl={directUrl}
        summary={{
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          roomName: "10 Bed Mixed Dorm",
        }}
        widgetBootstrap={() => {
          throw new Error("mocked widget failure");
        }}
      />,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(COPY.labels.fallbackTitle);
    expect(alert).toHaveTextContent(COPY.labels.fallbackBody);
    expect(screen.getByRole("link", { name: COPY.labels.continue })).toHaveAttribute("href", directUrl);
  });

  it("shows a branded continue card when no embed runtime is configured", async () => {
    const directUrl = getDirectUrl();

    render(
      <OctorateCustomPageShell
        {...COPY}
        directUrl={directUrl}
        summary={{
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          ratePlanLabel: "Non-refundable",
          roomName: "10 Bed Mixed Dorm",
        }}
      />,
    );

    expect(screen.getByText(COPY.labels.fallbackTitle)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: COPY.labels.continue })).toHaveAttribute("href", directUrl);
    expect(await screen.findByText(COPY.labels.ready)).toBeInTheDocument();
  });

  it("loads an external widget script and calls the global bootstrap when configured", async () => {
    const directUrl = getDirectUrl();
    const widgetScriptSrc = "https://cdn.example.test/octorate-widget.js";
    const globalBootstrap = jest.fn(() => undefined);
    getWindowGlobals().OctorateWidgetBootstrap = globalBootstrap;

    render(
      <OctorateCustomPageShell
        {...COPY}
        directUrl={directUrl}
        summary={{
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          roomName: "10 Bed Mixed Dorm",
        }}
        widgetGlobalKey="OctorateWidgetBootstrap"
        widgetScriptSrc={widgetScriptSrc}
      />,
    );

    const appendedScript = triggerScriptEvent(widgetScriptSrc, "load");

    await waitFor(() => expect(globalBootstrap).toHaveBeenCalledTimes(1));

    expect(appendedScript.async).toBe(true);
    expect(globalBootstrap).toHaveBeenCalledWith(
      expect.objectContaining({
        directUrl,
        hostPageUrl: expect.stringContaining("/en/book/secure-booking"),
        summary: expect.objectContaining({
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          roomName: "10 Bed Mixed Dorm",
        }),
      }),
    );
  });

  it("falls back when the external widget script loads without exposing the global bootstrap", async () => {
    const directUrl = getDirectUrl();
    const widgetScriptSrc = "https://cdn.example.test/octorate-widget-missing.js";
    delete getWindowGlobals().MissingBootstrap;

    render(
      <OctorateCustomPageShell
        {...COPY}
        directUrl={directUrl}
        summary={{
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          roomName: "10 Bed Mixed Dorm",
        }}
        widgetGlobalKey="MissingBootstrap"
        widgetScriptSrc={widgetScriptSrc}
      />,
    );

    triggerScriptEvent(widgetScriptSrc, "load");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(COPY.labels.fallbackTitle);
    expect(screen.getByRole("link", { name: COPY.labels.continue })).toHaveAttribute("href", directUrl);
  });

  it("cleans up the mocked widget when the host page unmounts", async () => {
    const destroy = jest.fn();
    const directUrl = getDirectUrl();
    const bootstrap = jest.fn(() => ({ destroy }));

    const { unmount } = render(
      <OctorateCustomPageShell
        {...COPY}
        directUrl={directUrl}
        summary={{
          checkin: "2026-06-16",
          checkout: "2026-06-18",
          pax: 2,
          roomName: "10 Bed Mixed Dorm",
        }}
        widgetBootstrap={bootstrap}
      />,
    );

    await waitFor(() => expect(bootstrap).toHaveBeenCalledTimes(1));

    unmount();

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    delete getWindowGlobals().OctorateWidgetBootstrap;
    delete getWindowGlobals().MissingBootstrap;
  });
});
