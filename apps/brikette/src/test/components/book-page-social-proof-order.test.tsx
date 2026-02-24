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
jest.mock("@/components/booking/DirectPerksBlock", () => ({ DirectPerksBlock: () => null }));
jest.mock("@/components/booking/LocationInline", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/booking/PolicyFeeClarityPanel", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/FaqStrip", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/rooms/RoomsSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/SocialProofSection", () => ({
  __esModule: true,
  default: () => <section data-testid="social-proof">Guests love Brikette</section>,
}));

const BookPageContent = require("@/app/[lang]/book/BookPageContent")
  .default as typeof import("@/app/[lang]/book/BookPageContent").default;

describe("Book page layout order", () => {
  it("renders guests-love social proof above the booking selector", () => {
    render(<BookPageContent lang="en" />);

    const socialProof = screen.getByText("Guests love Brikette");
    const updateButton = screen.getByRole("button", { name: /update/i });

    const order = socialProof.compareDocumentPosition(updateButton);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
