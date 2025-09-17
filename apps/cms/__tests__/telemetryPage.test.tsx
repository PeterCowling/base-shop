import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { TelemetryEvent } from "@acme/telemetry";

jest.mock("@/components/atoms/shadcn", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Input: ({ ...props }: any) => <input {...props} />,
}));

jest.mock("@acme/ui", () => ({
  LineChart: (props: any) => <div data-testid="line-chart" {...props} />,
  Loader: (props: any) => <div data-testid="loader" {...props} />, // simple stub
  Tag: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Toast: ({ open, message }: any) =>
    open ? <div role="status">{message}</div> : null,
}));

import {
  TelemetryAnalyticsView,
  filterTelemetryEvents,
} from "../src/app/cms/telemetry/page";

function createEvent(partial: Partial<TelemetryEvent> = {}): TelemetryEvent {
  return {
    name: "checkout.completed",
    ts: Date.now(),
    ...partial,
  } as TelemetryEvent;
}

describe("Telemetry analytics", () => {
  it("filters events by name and time range", () => {
    const now = Date.now();
    const events: TelemetryEvent[] = [
      createEvent({ name: "checkout.started", ts: now - 5 * 60 * 1000 }),
      createEvent({ name: "checkout.completed", ts: now - 60 * 60 * 1000 }),
      createEvent({ name: "profile.updated", ts: now - 10 * 60 * 1000 }),
    ];
    const filtered = filterTelemetryEvents(events, {
      name: "checkout",
      start: new Date(now - 10 * 60 * 1000).toISOString().slice(0, 16),
      end: new Date(now).toISOString().slice(0, 16),
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("checkout.started");
  });

  it("renders accessible table headers and live region", () => {
    const events: TelemetryEvent[] = [
      createEvent({ name: "checkout.started", ts: 1700000000000 }),
      createEvent({ name: "checkout.completed", ts: 1700000300000 }),
    ];
    render(
      <TelemetryAnalyticsView
        events={events}
        isLoading={false}
        error={null}
      />,
    );

    const headers = screen.getAllByRole("columnheader").map((header) =>
      header.textContent?.trim(),
    );
    expect(headers).toEqual(["Event", "Count", "Last seen"]);

    const liveRegion = screen.getByTestId("telemetry-announce");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveTextContent("Showing 2 of 2 events");

    const nameInput = screen.getByLabelText(/event name/i);
    fireEvent.change(nameInput, { target: { value: "checkout" } });
    expect(screen.getByTestId("telemetry-announce")).toHaveTextContent(
      "Showing 2 of 2 events",
    );
  });
});
