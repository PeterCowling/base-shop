/* i18n-exempt file -- tests verify placeholder and status messages */
import "../../../../../../test/resetNextMocks";

import { cleanup,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { type Review,ReviewsList } from "../ReviewsList";

const reviews: Review[] = [
  { author: "Alice", rating: 5, content: "Great product" },
  { author: "Bob", rating: 4, content: "Okay item" },
  { author: "Cara", rating: 3, content: "Great service" },
];

describe("ReviewsList", () => {
  it("filters by rating and query", () => {
    render(<ReviewsList reviews={reviews} minRating={4} query="great" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Cara")).not.toBeInTheDocument();
  });

  it("supports controlled and uncontrolled query", async () => {
    // uncontrolled
    const user = userEvent.setup();
    render(<ReviewsList reviews={reviews} filterable />);
    await user.type(screen.getByPlaceholderText("Search reviews…"), "Ali");
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    // controlled
    cleanup();
    const handleQuery = jest.fn();
    const { rerender } = render(
      <ReviewsList
        reviews={reviews}
        filterable
        query=""
        onQueryChange={handleQuery}
      />
    );
    await user.type(screen.getByPlaceholderText("Search reviews…"), "Bo");
    expect(handleQuery).toHaveBeenCalledTimes(2);
    // still shows all reviews because value is controlled externally
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    rerender(
      <ReviewsList
        reviews={reviews}
        filterable
        query="Bob"
        onQueryChange={handleQuery}
      />
    );
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("shows message when no reviews match", () => {
    render(<ReviewsList reviews={reviews} minRating={5} query="zzz" />);
    expect(
      screen.getByText("No reviews found.")
    ).toBeInTheDocument();
  });
});
