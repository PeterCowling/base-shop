import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";
import { getLegalDocument } from "@/lib/legalContent";

import ShippingPage, { generateMetadata } from "./page";

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

describe("ShippingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["shipping", "policy"]);
    mockGetLegalDocument.mockReturnValue({
      title: "Shipping",
      summary: "Shipping summary",
      effectiveDate: "13 March 2026",
      intro: ["Intro"],
      sections: [],
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "en" }) });

    expect(metadata).toEqual({
      title: "Shipping | Caryina",
      description: "Shipping summary",
      keywords: ["shipping", "policy"],
    });
    expect(mockGetLegalDocument).toHaveBeenCalledWith("en", "shipping");
  });

  it("renders policy page for shipping", async () => {
    const ui = (await ShippingPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toHaveTextContent("Shipping");
  });
});
