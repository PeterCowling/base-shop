/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { IdeasList } from "./IdeasList";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("IdeasList", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("TC-04: supports click-through navigation to idea detail", async () => {
    const user = userEvent.setup();
    render(
      <IdeasList
        items={[
          {
            id: "BRIK-OPP-0001",
            title: "Launch WhatsApp retention funnel",
            business: "BRIK",
            status: "raw",
            priority: "P1",
            location: "inbox",
            createdDate: "2026-02-09",
            tags: ["growth", "messaging"],
          },
        ]}
      />
    );

    const rowLink = screen.getByRole("link", { name: /open idea brik-opp-0001/i });
    await user.click(rowLink);

    expect(pushMock).toHaveBeenCalledWith("/ideas/BRIK-OPP-0001");
  });

  it("TC-05: renders mobile stacked-card metadata fields", () => {
    render(
      <IdeasList
        items={[
          {
            id: "BRIK-OPP-0002",
            title: "Email win-back campaign",
            business: "BRIK",
            status: "worked",
            priority: "P2",
            location: "worked",
            createdDate: "2026-02-01",
            tags: [],
          },
        ]}
      />
    );

    expect(screen.getAllByText("Email win-back campaign")).not.toHaveLength(0);
    expect(screen.getAllByText("BRIK")).not.toHaveLength(0);
    expect(screen.getAllByText("worked")).not.toHaveLength(0);
    expect(screen.getAllByText("P2")).not.toHaveLength(0);
  });
});
