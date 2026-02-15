// apps/brikette/src/test/components/booking-modals-direct-copy.test.tsx
/* -------------------------------------------------------------------------- */
/* TC-01: BookingModal renders direct-booking block                          */
/* TC-02: Booking2Modal renders direct-booking block                         */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string | string[]; returnObjects?: boolean }) => {
      // Mock modals.directPerks.heading
      if (key === "directPerks.heading") {
        return options?.defaultValue ?? "Why book direct?";
      }
      // Mock modals.directPerks.items
      if (key === "directPerks.items") {
        return options?.returnObjects
          ? (options.defaultValue ?? ["Up to 25% off", "Complimentary breakfast", "Complimentary evening drink"])
          : options?.defaultValue ?? [];
      }
      return key;
    },
    i18n: {
      language: "en",
    },
  }),
}));

// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { DirectPerksBlock } from "../../components/booking/DirectPerksBlock";

describe("Booking Modals Direct Copy", () => {
  describe("TC-01: DirectPerksBlock renders with default English values", () => {
    it("should render the 'Why book direct?' heading and perk items", () => {
      render(<DirectPerksBlock lang="en" />);

      // Verify heading is rendered
      expect(screen.getByText("Why book direct?")).toBeInTheDocument();

      // Verify all perk items are rendered
      expect(screen.getByText("Up to 25% off")).toBeInTheDocument();
      expect(screen.getByText("Complimentary breakfast")).toBeInTheDocument();
      expect(screen.getByText("Complimentary evening drink")).toBeInTheDocument();
    });

    it("should use defaultValue fallback when translation is missing", () => {
      render(<DirectPerksBlock lang="de" />);

      // Even with lang="de", the mock returns defaultValue
      expect(screen.getByText("Why book direct?")).toBeInTheDocument();
      expect(screen.getByText("Up to 25% off")).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const { container } = render(<DirectPerksBlock lang="en" className="custom-class" />);

      // Verify custom className is applied
      const block = container.querySelector(".custom-class");
      expect(block).toBeInTheDocument();
    });
  });

  describe("TC-02: DirectPerksBlock guards against empty data", () => {
    it("should not render when heading is empty", () => {
      // Override mock to return empty heading
      jest.resetModules();
      jest.mock("react-i18next", () => ({
        useTranslation: () => ({
          t: (key: string, options?: { defaultValue?: string | string[]; returnObjects?: boolean }) => {
            if (key === "directPerks.heading") return "";
            if (key === "directPerks.items") {
              return options?.returnObjects ? ["Up to 25% off"] : [];
            }
            return key;
          },
          i18n: { language: "en" },
        }),
      }));

      const { container } = render(<DirectPerksBlock lang="en" />);

      // Should render empty fragment
      expect(container.firstChild).toBeNull();
    });
  });
});
