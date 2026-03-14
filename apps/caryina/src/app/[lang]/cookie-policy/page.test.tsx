import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";
import { getLegalDocument } from "@/lib/legalContent";

import CookiePolicyPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/lib/legalContent", () => ({
  getLegalDocument: jest.fn(),
}));

jest.mock("@/components/LegalDocumentPage", () => ({
  LegalDocumentPage: ({ document }: { document: { title: string } }) => (
    <div data-testid="policy-page">{document.title}</div>
  ),
}));

jest.mock("@/components/CookiePreferencesPanel.client", () => ({
  CookiePreferencesPanel: () => <div data-testid="cookie-preferences-panel" />,
}));

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;
const mockGetLegalDocument = getLegalDocument as jest.MockedFunction<typeof getLegalDocument>;

describe("CookiePolicyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["cookies", "policy"]);
    mockGetLegalDocument.mockReturnValue({
      title: "Cookie Policy",
      summary: "Cookie summary",
      effectiveDate: "13 March 2026",
      intro: ["Intro"],
      sections: [],
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "en" }) });

    expect(metadata).toEqual({
      title: "Cookie Policy | Caryina",
      description: "Cookie summary",
      keywords: ["cookies", "policy"],
    });
    expect(mockGetLegalDocument).toHaveBeenCalledWith("en", "cookie");
  });

  it("renders the cookie policy page", async () => {
    const ui = (await CookiePolicyPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toHaveTextContent("Cookie Policy");
    expect(screen.getByTestId("cookie-preferences-panel")).toBeInTheDocument();
  });
});
