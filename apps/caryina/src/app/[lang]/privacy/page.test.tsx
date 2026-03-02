import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getPolicyContent, getSeoKeywords } from "@/lib/contentPacket";

import PrivacyPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getPolicyContent: jest.fn(),
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/components/PolicyPage", () => ({
  PolicyPage: ({ title }: { title: string }) => <div data-testid="policy-page">{title}</div>,
}));

const mockGetPolicyContent = getPolicyContent as jest.MockedFunction<typeof getPolicyContent>;
const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("PrivacyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["privacy", "policy"]);
    mockGetPolicyContent.mockReturnValue({
      title: "Privacy",
      summary: "Privacy summary",
      bullets: ["Data handling"],
      notice: null,
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "it" }) });

    expect(metadata).toEqual({
      title: "Privacy | Caryina",
      description: "Privacy summary",
      keywords: ["privacy", "policy"],
    });
    expect(mockGetPolicyContent).toHaveBeenCalledWith("it", "privacy");
  });

  it("renders privacy policy page", async () => {
    const ui = (await PrivacyPage({
      params: Promise.resolve({ lang: "it" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toHaveTextContent("Privacy");
  });
});
