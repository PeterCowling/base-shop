import { render, screen, act } from "@testing-library/react";
import ReviewsCarousel from "../src/components/home/ReviewsCarousel";

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
      "--color-muted"
    );
    expect(
      screen.getByText(/Anna quote/).closest("blockquote")
    ).toHaveAttribute("data-token", "--color-fg");
    expect(screen.getByText(/—\s*Anna/)).toHaveAttribute(
      "data-token",
      "--color-muted"
    );
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    expect(screen.getByText(/Luca quote/)).toBeInTheDocument();
  });

  it("renders provided reviews", () => {
    Object.assign(translations, { quote1: "Great", name1: "Bob" });
    render(
      <ReviewsCarousel reviews={[{ quoteKey: "quote1", nameKey: "name1" }]} />
    );
    expect(screen.getByText(/Great/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("falls back to defaults when passed an empty array", () => {
    Object.assign(translations, {
      "review.anna.quote": "Anna quote",
      "review.anna.name": "Anna",
    });
    render(<ReviewsCarousel reviews={[]} />);
    expect(screen.getByText(/Anna quote/)).toBeInTheDocument();
    expect(screen.getByText(/—\s*Anna/)).toBeInTheDocument();
  });
});

