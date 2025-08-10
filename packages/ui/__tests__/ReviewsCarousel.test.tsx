import { render, screen, act } from "@testing-library/react";
import ReviewsCarousel from "../src/components/home/ReviewsCarousel";

const translations: Record<string, string> = {};

jest.mock("@/i18n/Translations", () => ({
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

    render(<ReviewsCarousel />);
    expect(screen.getByText("Anna quote")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    expect(screen.getByText("Luca quote")).toBeInTheDocument();
  });

  it("renders provided reviews", () => {
    Object.assign(translations, { quote1: "Great", name1: "Bob" });
    render(
      <ReviewsCarousel reviews={[{ quoteKey: "quote1", nameKey: "name1" }]} />
    );
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });
});

