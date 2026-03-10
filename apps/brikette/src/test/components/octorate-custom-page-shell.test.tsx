import "@testing-library/jest-dom";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import OctorateCustomPageShell from "@/components/booking/OctorateCustomPageShell";
import { buildOctorateUrl } from "@/utils/buildOctorateUrl";

const COPY = {
  continueLabel: "Continue to secure booking",
  fallbackBody: "If the embedded booking step is unavailable, use the direct Octorate link.",
  fallbackTitle: "Direct booking link ready",
  heading: "Secure your booking",
  loadingText: "Loading secure booking step...",
  readyText: "Secure booking step loaded.",
  securityNote: "You remain on the Brikette domain until the secure booking tool finishes loading.",
  stepLabel: "Step 3 of 3",
  supportingText: "Review your stay, then continue into the secure booking engine.",
  summaryLabels: {
    checkin: "Check-in",
    checkout: "Check-out",
    guests: "Guests",
    rate: "Rate",
    room: "Room",
  },
  widgetHostLabel: "Secure booking widget host",
} as const;

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
    expect(screen.getByLabelText(COPY.widgetHostLabel)).toBeInTheDocument();
    expect(screen.getByText(COPY.readyText)).toBeInTheDocument();
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
    expect(alert).toHaveTextContent(COPY.fallbackTitle);
    expect(alert).toHaveTextContent(COPY.fallbackBody);
    expect(screen.getByRole("link", { name: COPY.continueLabel })).toHaveAttribute("href", directUrl);
  });

  it("loads an external widget script and calls the global bootstrap when configured", async () => {
    const directUrl = getDirectUrl();
    const widgetScriptSrc = "https://cdn.example.test/octorate-widget.js";
    const globalBootstrap = jest.fn(() => undefined);
    (window as Record<string, unknown>).OctorateWidgetBootstrap = globalBootstrap;

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
    delete (window as Record<string, unknown>).MissingBootstrap;

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
    expect(alert).toHaveTextContent(COPY.fallbackTitle);
    expect(screen.getByRole("link", { name: COPY.continueLabel })).toHaveAttribute("href", directUrl);
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
    delete (window as Record<string, unknown>).OctorateWidgetBootstrap;
    delete (window as Record<string, unknown>).MissingBootstrap;
  });
});
