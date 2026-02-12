/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import type { Business } from "@/lib/types";

import { IdeasFilters } from "./IdeasFilters";
import type { IdeasQueryState } from "./query-params";

const businesses: Business[] = [
  {
    id: "BRIK",
    name: "Brikette",
    description: "Retail ops",
    owner: "Pete",
    status: "active",
    created: "2026-01-01",
    tags: [],
  },
];

const state: IdeasQueryState = {
  business: "BRIK",
  status: "raw",
  location: "worked",
  tag: "growth",
  q: "retention",
  primaryPage: 3,
  primaryPageSize: 25,
  secondaryPage: 2,
  secondaryPageSize: 100,
};

describe("IdeasFilters", () => {
  it("TC-06: renders shared filters and independent section page size controls", () => {
    render(<IdeasFilters businesses={businesses} state={state} />);

    expect(screen.getByLabelText("Search")).toHaveValue("retention");
    expect(screen.getByLabelText("Business")).toHaveValue("BRIK");
    expect(screen.getByLabelText("Status")).toHaveValue("raw");
    expect(screen.getByLabelText("Location")).toHaveValue("worked");
    expect(screen.getByLabelText("Tag contains")).toHaveValue("growth");

    expect(screen.getByLabelText("Primary page size")).toHaveValue("25");
    expect(screen.getByLabelText("Secondary page size")).toHaveValue("100");
  });

  it("resets both section page cursors to 1 on submit", () => {
    render(<IdeasFilters businesses={businesses} state={state} />);

    const form = screen.getByRole("button", { name: "Apply filters" }).closest("form");
    expect(form?.querySelector("input[name='primaryPage']")).toHaveValue("1");
    expect(form?.querySelector("input[name='secondaryPage']")).toHaveValue("1");
  });
});
