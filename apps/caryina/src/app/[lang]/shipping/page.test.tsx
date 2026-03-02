import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getPolicyContent, getSeoKeywords } from "@/lib/contentPacket";

import ShippingPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getPolicyContent: jest.fn(),
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/components/PolicyPage", () => ({
  PolicyPage: ({ title, sourcePath }: { title: string; sourcePath?: string }) => (
    <div data-testid="policy-page">{`${title}:${sourcePath ?? ""}`}</div>
  ),
}));

const mockGetPolicyContent = getPolicyContent as jest.MockedFunction<typeof getPolicyContent>;
const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("ShippingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["shipping", "policy"]);
    mockGetPolicyContent.mockReturnValue({
      title: "Shipping",
      summary: "Shipping summary",
      bullets: ["Tracked delivery"],
      notice: null,
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "en" }) });

    expect(metadata).toEqual({
      title: "Shipping | Caryina",
      description: "Shipping summary",
      keywords: ["shipping", "policy"],
    });
    expect(mockGetPolicyContent).toHaveBeenCalledWith("en", "shipping");
  });

  it("renders policy page for shipping", async () => {
    const ui = (await ShippingPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toHaveTextContent(
      "Shipping:docs/business-os/startup-baselines/HBAG-content-packet.md",
    );
  });
});
