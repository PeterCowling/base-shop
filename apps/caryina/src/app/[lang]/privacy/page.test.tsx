import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";
import { getLegalDocument } from "@/lib/legalContent";

import PrivacyPage, { generateMetadata } from "./page";

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

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;
const mockGetLegalDocument = getLegalDocument as jest.MockedFunction<typeof getLegalDocument>;

describe("PrivacyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["privacy", "policy"]);
    mockGetLegalDocument.mockReturnValue({
      title: "Privacy",
      summary: "Privacy summary",
      effectiveDate: "13 March 2026",
      intro: ["Intro"],
      sections: [],
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "it" }) });

    expect(metadata).toEqual({
      title: "Privacy | Caryina",
      description: "Privacy summary",
      keywords: ["privacy", "policy"],
    });
    expect(mockGetLegalDocument).toHaveBeenCalledWith("it", "privacy");
  });

  it("renders privacy policy page", async () => {
    const ui = (await PrivacyPage({
      params: Promise.resolve({ lang: "it" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toHaveTextContent("Privacy");
  });
});
