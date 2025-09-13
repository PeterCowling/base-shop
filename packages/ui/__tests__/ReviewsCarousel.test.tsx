import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      <ReviewsCarousel reviews={[{ quoteKey: "quote1", nameKey: "name1" }]} />
    );
    expect(screen.getByText(/Great/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("returns null when no reviews are provided", () => {
    const { container } = render(<ReviewsCarousel reviews={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

