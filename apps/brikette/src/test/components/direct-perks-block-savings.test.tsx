// apps/brikette/src/test/components/direct-perks-block-savings.test.tsx
/* -------------------------------------------------------------------------- */
/* TC-04-01: renders savings eyebrow + headline above heading when both present */
/* TC-04-02: without savings props component renders identically to baseline  */
/* TC-04-03: empty string savings props suppress the savings block           */
/* TC-04-04: only one of the two savings props — no savings block rendered   */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string | string[]; returnObjects?: boolean }) => {
      if (key === "directPerks.heading") {
        return options?.defaultValue ?? "Why book direct?";
      }
      if (key === "directPerks.items") {
        return options?.returnObjects
          ? (options.defaultValue ?? ["Up to 25% off", "Complimentary breakfast", "Complimentary evening drink"])
          : (options?.defaultValue ?? []);
      }
      return options?.defaultValue ?? key;
    },
    i18n: { language: "en" },
  }),
}));

// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { DirectPerksBlock } from "../../components/booking/DirectPerksBlock";

describe("DirectPerksBlock savings headline", () => {
  describe("TC-04-01: renders savings eyebrow and headline above heading", () => {
    it("renders eyebrow and headline above 'Why book direct?' when both props are provided", () => {
      render(
        <DirectPerksBlock
          lang="en"
          savingsEyebrow="Book direct and save"
          savingsHeadline="Up to 25% less than Booking.com"
        />,
      );

      const eyebrow = screen.getByText("Book direct and save");
      const headline = screen.getByText("Up to 25% less than Booking.com");
      const heading = screen.getByText("Why book direct?");

      expect(eyebrow).toBeInTheDocument();
      expect(headline).toBeInTheDocument();
      expect(heading).toBeInTheDocument();

      // Eyebrow must appear before the "Why book direct?" heading in document order
      expect(eyebrow.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // Headline must also appear before the heading
      expect(headline.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe("TC-04-02: without savings props, component renders identically to baseline", () => {
    it("renders heading and items without a savings block when no savings props are passed", () => {
      render(<DirectPerksBlock lang="en" />);

      expect(screen.getByText("Why book direct?")).toBeInTheDocument();
      expect(screen.queryByText("Book direct and save")).not.toBeInTheDocument();
      expect(screen.queryByText("Up to 25% less than Booking.com")).not.toBeInTheDocument();
    });
  });

  describe("TC-04-03: empty string savings props — savings block is suppressed", () => {
    it("does not render savings block when both props are empty strings", () => {
      render(<DirectPerksBlock lang="en" savingsEyebrow="" savingsHeadline="" />);

      expect(screen.queryByText("Book direct and save")).not.toBeInTheDocument();
      expect(screen.getByText("Why book direct?")).toBeInTheDocument();
    });
  });

  describe("TC-04-04: only one savings prop — both required to show the block", () => {
    it("does not render savings block when only savingsEyebrow is provided", () => {
      render(<DirectPerksBlock lang="en" savingsEyebrow="Book direct and save" />);

      expect(screen.queryByText("Book direct and save")).not.toBeInTheDocument();
      expect(screen.getByText("Why book direct?")).toBeInTheDocument();
    });

    it("does not render savings block when only savingsHeadline is provided", () => {
      render(<DirectPerksBlock lang="en" savingsHeadline="Up to 25% less than Booking.com" />);

      expect(screen.queryByText("Up to 25% less than Booking.com")).not.toBeInTheDocument();
      expect(screen.getByText("Why book direct?")).toBeInTheDocument();
    });
  });
});
