import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";
import { getLegalDocument } from "@/lib/legalContent";

import ReturnsPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/lib/legalContent", () => ({
  getLegalDocument: jest.fn(),
}));

jest.mock("@/components/LegalDocumentPage", () => ({
  LegalDocumentPage: ({
    document,
  }: {
    document: { title: string; summary: string; sections: Array<{ heading: string }> };
  }) => (
    <div data-testid="policy-page">
      <h1>{document.title}</h1>
      <p>{document.summary}</p>
      <p>{document.sections.map((section) => section.heading).join("|")}</p>
    </div>
  ),
}));

jest.mock("@/components/ReturnsRequestForm.client", () => ({
  ReturnsRequestForm: () => <div data-testid="returns-request-form">form</div>,
}));

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;
const mockGetLegalDocument = getLegalDocument as jest.MockedFunction<typeof getLegalDocument>;

describe("ReturnsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["returns", "policy"]);
    mockGetLegalDocument.mockReturnValue({
      title: "Returns",
      summary: "Returns summary",
      effectiveDate: "13 March 2026",
      intro: ["Intro"],
      sections: [{ id: "cooling-off", heading: "Cooling-off", paragraphs: ["Body"] }],
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "de" }) });

    expect(metadata).toEqual({
      title: "Returns | Caryina",
      description: "Returns summary",
      keywords: ["returns", "policy"],
    });
    expect(mockGetLegalDocument).toHaveBeenCalledWith("de", "returns");
  });

  it("renders the legal document page", async () => {
    const ui = (await ReturnsPage({
      params: Promise.resolve({ lang: "de" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toBeInTheDocument();
    expect(screen.getByTestId("returns-request-form")).toBeInTheDocument();
    expect(screen.getByText("Returns")).toBeInTheDocument();
    expect(screen.getByText("Cooling-off")).toBeInTheDocument();
  });
});
