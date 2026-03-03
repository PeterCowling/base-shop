import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/book",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock("@/hooks/usePagePreload", () => ({ usePagePreload: () => {} }));
jest.mock("@/components/seo/BookPageStructuredData", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/SocialProofSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/FaqStrip", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/booking/LocationInline", () => ({ __esModule: true, default: () => <div data-cy="location-inline" /> }));
jest.mock("@/components/booking/PolicyFeeClarityPanel", () => ({ __esModule: true, default: () => <div data-cy="policy-panel" /> }));

jest.mock("@/components/booking/DirectPerksBlock", () => ({
  DirectPerksBlock: ({ savingsEyebrow, savingsHeadline }: { savingsEyebrow?: string; savingsHeadline?: string }) => (
    <div data-cy="direct-perks-block">
      {savingsEyebrow && <p>{savingsEyebrow}</p>}
      {savingsHeadline && <p>{savingsHeadline}</p>}
      Why book direct?
    </div>
  ),
}));

jest.mock("@/components/rooms/RoomsSection", () => ({
  __esModule: true,
  default: () => <div data-cy="rooms-section">Rooms</div>,
}));

const BookPageContent = require("@/app/[lang]/book/BookPageContent")
  .default as typeof import("@/app/[lang]/book/BookPageContent").default;

describe("Book page perks CTA order", () => {
  it("renders the rooms section before post-room information panels", () => {
    render(<BookPageContent lang="en" heading="Book your stay" />);

    const roomsSection = screen.getByText("Rooms");
    const locationInline = screen.getByTestId("location-inline");
    const policyPanel = screen.getByTestId("policy-panel");

    expect(
      roomsSection.compareDocumentPosition(locationInline) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      roomsSection.compareDocumentPosition(policyPanel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not render the deprecated direct-perks block in the book-page layout", () => {
    render(<BookPageContent lang="en" heading="Book your stay" />);

    expect(screen.queryByTestId("direct-perks-block")).not.toBeInTheDocument();
  });

  it("still renders LocationInline and PolicyFeeClarityPanel after rooms section", () => {
    render(<BookPageContent lang="en" heading="Book your stay" />);

    const roomsSection = screen.getByText("Rooms");
    const locationInline = screen.getByTestId("location-inline");
    const policyPanel = screen.getByTestId("policy-panel");

    // Both post-rooms components follow the rooms section in document order.
    expect(
      roomsSection.compareDocumentPosition(locationInline) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      roomsSection.compareDocumentPosition(policyPanel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
