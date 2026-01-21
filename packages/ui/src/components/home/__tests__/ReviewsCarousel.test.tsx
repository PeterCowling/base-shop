import { act,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ReviewsCarousel, { type Review } from "../ReviewsCarousel";

const translations: Record<string, string> = {};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

beforeEach(() => {
  jest.useFakeTimers();
  Object.keys(translations).forEach((k) => delete translations[k]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("ReviewsCarousel", () => {
  it("renders default review and auto advances", () => {
    Object.assign(translations, {
      "review.anna.quote": "Anna quote",
      "review.anna.name": "Anna",
      "review.luca.quote": "Luca quote",
      "review.luca.name": "Luca",
    });

    const { container } = render(<ReviewsCarousel />);
    expect(screen.getByText(/Anna quote/)).toBeInTheDocument();
    expect(container.querySelector("section")).toHaveAttribute(
      "data-token",
      "--color-muted",
    );
    expect(
      screen.getByText(/Anna quote/).closest("blockquote"),
    ).toHaveAttribute("data-token", "--color-fg");
    expect(screen.getByText(/—\s*Anna/)).toHaveAttribute(
      "data-token",
      "--color-muted",
    );
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    expect(screen.getByText(/Luca quote/)).toBeInTheDocument();
  });

  it("allows navigating reviews with next and previous controls", async () => {
    Object.assign(translations, {
      "review.anna.quote": "Anna quote",
      "review.anna.name": "Anna",
      "review.luca.quote": "Luca quote",
      "review.luca.name": "Luca",
    });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<ReviewsCarousel />);
    expect(screen.getByText(/Anna quote/)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/next review/i));
    expect(screen.getByText(/Luca quote/)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/previous review/i));
    expect(screen.getByText(/Anna quote/)).toBeInTheDocument();
  });

  it("renders provided reviews", () => {
    Object.assign(translations, { quote1: "Great", name1: "Bob" });
    render(
      <ReviewsCarousel reviews={[{ quoteKey: "quote1", nameKey: "name1" }]} />,
    );
    expect(screen.getByText(/Great/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("auto advances custom reviews every 8s", async () => {
    Object.assign(translations, {
      quote1: "Quote 1",
      name1: "Name 1",
      quote2: "Quote 2",
      name2: "Name 2",
    });

    const reviews = [
      { quoteKey: "quote1", nameKey: "name1" },
      { quoteKey: "quote2", nameKey: "name2" },
    ];

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<ReviewsCarousel reviews={reviews} />);
    expect(screen.getByText(/Quote 1/)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    expect(screen.getByText(/Quote 2/)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/previous review/i));
    expect(screen.getByText(/Quote 1/)).toBeInTheDocument();
  });

  it("uses default reviews when an empty array is provided", () => {
    Object.assign(translations, {
      "review.anna.quote": "Anna quote",
      "review.anna.name": "Anna",
    });

    render(<ReviewsCarousel reviews={[]} />);
    expect(screen.getByText(/Anna quote/)).toBeInTheDocument();
    expect(screen.getByText(/—\s*Anna/)).toBeInTheDocument();
  });

  it("prefers translated aria labels when available", () => {
    Object.assign(translations, {
      "review.anna.quote": "Anna quote",
      "review.anna.name": "Anna",
      "reviews.prev": "Zurück",
      "reviews.next": "Weiter",
    });

    render(<ReviewsCarousel />);

    expect(screen.getByRole("button", { name: "Zurück" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeInTheDocument();
  });

  it("returns null when the resolved review list is empty", () => {
    let calls = 0;
    const tricky = {
      0: { quoteKey: "quote", nameKey: "name" },
      get length() {
        calls += 1;
        return calls === 1 ? 1 : 0;
      },
    } as unknown as Review[];

    const { container } = render(<ReviewsCarousel reviews={tricky} />);
    expect(container.firstChild).toBeNull();
  });
});
