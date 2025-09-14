/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import OrderTimeline from "../src/app/account/orders/[id]/timeline";
import { listEvents } from "@platform-core/repositories/reverseLogisticsEvents.server";

const events = [
  { id: "1", sessionId: "s1", event: "received", createdAt: "2023-01-01" },
  { id: "2", sessionId: "s1", event: "cleaned", createdAt: "2023-02-01" },
  { id: "3", sessionId: "s2", event: "qaPassed", createdAt: "2023-03-01" },
];

jest.mock("@platform-core/repositories/reverseLogisticsEvents.server", () => ({
  listEvents: jest.fn(),
}));

jest.mock("@acme/date-utils", () => ({ formatTimestamp: (d: string) => `f-${d}` }));

jest.mock("../shop.json", () => ({ id: "shop1" }), { virtual: true });

describe("OrderTimeline", () => {
  it("filters and sorts events", async () => {
    (listEvents as jest.Mock).mockResolvedValue(events);
    const ui = (await OrderTimeline({ params: { id: "s1" } })) as ReactElement;
    render(ui);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Received");
    expect(items[1]).toHaveTextContent("Cleaned");
  });
});
