/**
 * EmptyLaneState Component Tests
 * BOS-UX-12
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import type { Lane } from "@/lib/types";

import { EmptyLaneState } from "./EmptyLaneState";

describe("EmptyLaneState", () => {
  it("shows Inbox message for Inbox lane", () => {
    render(<EmptyLaneState lane="Inbox" hasFilters={false} />);

    expect(
      screen.getByText(/no cards in inbox/i)
    ).toBeInTheDocument();
  });

  it("shows Fact-finding message for Fact-finding lane", () => {
    render(<EmptyLaneState lane="Fact-finding" hasFilters={false} />);

    expect(
      screen.getByText(/no cards in fact-finding/i)
    ).toBeInTheDocument();
  });

  it("shows Planned message for Planned lane", () => {
    render(<EmptyLaneState lane="Planned" hasFilters={false} />);

    expect(screen.getByText(/no cards planned yet/i)).toBeInTheDocument();
  });

  it("shows In progress message for In progress lane", () => {
    render(<EmptyLaneState lane="In progress" hasFilters={false} />);

    expect(screen.getByText(/no active work/i)).toBeInTheDocument();
  });

  it("shows Done message for Done lane", () => {
    render(<EmptyLaneState lane="Done" hasFilters={false} />);

    expect(screen.getByText(/no completed cards/i)).toBeInTheDocument();
  });

  it("shows Reflected message for Reflected lane", () => {
    render(<EmptyLaneState lane="Reflected" hasFilters={false} />);

    expect(screen.getByText(/no reflected cards/i)).toBeInTheDocument();
  });

  it("shows filter message when hasFilters is true", () => {
    render(<EmptyLaneState lane="Inbox" hasFilters={true} />);

    expect(
      screen.getByText(/no cards match your filters/i)
    ).toBeInTheDocument();
  });

  it("shows CTA button for Inbox lane", () => {
    render(<EmptyLaneState lane="Inbox" hasFilters={false} />);

    const button = screen.getByRole("link", { name: /create card/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", "/cards/new");
  });

  it("does not show CTA button when hasFilters is true", () => {
    render(<EmptyLaneState lane="Inbox" hasFilters={true} />);

    const button = screen.queryByRole("link", { name: /create card/i });
    expect(button).not.toBeInTheDocument();
  });
});
