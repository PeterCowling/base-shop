import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getPolicyContent, getSeoKeywords } from "@/lib/contentPacket";

import TermsPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getPolicyContent: jest.fn(),
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/components/PolicyPage", () => ({
  PolicyPage: ({ title }: { title: string }) => <div data-testid="policy-page">{title}</div>,
}));

const mockGetPolicyContent = getPolicyContent as jest.MockedFunction<typeof getPolicyContent>;
const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("TermsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["terms", "policy"]);
    mockGetPolicyContent.mockReturnValue({
      title: "Terms",
      summary: "Terms summary",
      bullets: ["Use policy"],
      notice: null,
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "fr" }) });

    expect(metadata).toEqual({
      title: "Terms | Caryina",
      description: "Terms summary",
      keywords: ["terms", "policy"],
    });
    expect(mockGetPolicyContent).toHaveBeenCalledWith("fr", "terms");
  });

  it("renders terms policy page", async () => {
    const ui = (await TermsPage({
      params: Promise.resolve({ lang: "fr" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toHaveTextContent("Terms");
  });
});
