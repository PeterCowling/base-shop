import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewsList, type Review } from "./ReviewsList";
import "../../../../../test/resetNextMocks";

jest.mock("../atoms/primitives/select", () => {
  const React = require("react");
  return {
    __esModule: true,
    Select: ({ value, onValueChange, children }: any) => (
      <select
        data-cy="rating-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => (
      <option value="">{placeholder}</option>
    ),
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

const reviews: Review[] = [
  { author: "Alice", rating: 5, content: "Great" },
  { author: "Bob", rating: 4, content: "Good" },
  { author: "Cara", rating: 3, content: "Okay" },
  { author: "Dan", rating: 2, content: "Bad" },
];

describe("ReviewsList", () => {
  it("loads reviews when data arrives", () => {
    const { rerender } = render(<ReviewsList reviews={[]} />);
    expect(screen.getByText("No reviews found.")).toBeInTheDocument();

    rerender(<ReviewsList reviews={reviews.slice(0, 2)} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("paginates by updating reviews prop", () => {
    const { rerender } = render(<ReviewsList reviews={reviews.slice(0, 2)} />);
    expect(screen.queryByText("Dan")).not.toBeInTheDocument();

    rerender(<ReviewsList reviews={reviews.slice(2)} />);
    expect(screen.getByText("Dan")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("filters using sort options", async () => {
    const user = userEvent.setup();
    render(<ReviewsList reviews={reviews} filterable />);

    const select = screen.getByTestId("rating-select");
    await user.selectOptions(select, "4");

    expect(screen.queryByText("Cara")).not.toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});

