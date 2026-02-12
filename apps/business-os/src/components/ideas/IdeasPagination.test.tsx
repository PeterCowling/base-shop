/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import { IdeasPagination } from "./IdeasPagination";
import type { IdeasQueryState } from "./query-params";

const state: IdeasQueryState = {
  business: "BRIK",
  status: "raw",
  location: "inbox",
  tag: "ops",
  q: "email",
  primaryPage: 3,
  primaryPageSize: 25,
  secondaryPage: 2,
  secondaryPageSize: 100,
};

describe("IdeasPagination", () => {
  it("TC-05: primary pager updates only primary page param", () => {
    render(
      <IdeasPagination
        section="primary"
        title="Primary"
        state={state}
        page={3}
        pageSize={25}
        totalItems={80}
        totalPages={4}
      />
    );

    const previousLink = screen.getByRole("link", { name: "Previous" });
    const nextLink = screen.getByRole("link", { name: "Next" });

    expect(previousLink).toHaveAttribute(
      "href",
      "/ideas?business=BRIK&status=raw&location=inbox&tag=ops&q=email&primaryPage=2&primaryPageSize=25&secondaryPage=2&secondaryPageSize=100"
    );
    expect(nextLink).toHaveAttribute(
      "href",
      "/ideas?business=BRIK&status=raw&location=inbox&tag=ops&q=email&primaryPage=4&primaryPageSize=25&secondaryPage=2&secondaryPageSize=100"
    );
  });

  it("TC-05: secondary pager updates only secondary page param", () => {
    render(
      <IdeasPagination
        section="secondary"
        title="Secondary"
        state={state}
        page={2}
        pageSize={100}
        totalItems={120}
        totalPages={2}
      />
    );

    const previousLink = screen.getByRole("link", { name: "Previous" });
    const nextLink = screen.getByRole("link", { name: "Next" });

    expect(previousLink).toHaveAttribute(
      "href",
      "/ideas?business=BRIK&status=raw&location=inbox&tag=ops&q=email&primaryPage=3&primaryPageSize=25&secondaryPageSize=100"
    );
    expect(nextLink).toHaveAttribute(
      "href",
      "/ideas?business=BRIK&status=raw&location=inbox&tag=ops&q=email&primaryPage=3&primaryPageSize=25&secondaryPage=2&secondaryPageSize=100"
    );
  });
});
