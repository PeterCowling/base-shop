import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getPolicyContent, getSeoKeywords } from "@/lib/contentPacket";

import ReturnsPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getPolicyContent: jest.fn(),
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/components/PolicyPage", () => ({
  PolicyPage: ({
    title,
    summary,
    bullets,
    notice,
    sourcePath,
  }: {
    title: string;
    summary: string;
    bullets?: string[];
    notice?: string | null;
    sourcePath?: string;
  }) => (
    <div data-cy="policy-page">
      <h1>{title}</h1>
      <p>{summary}</p>
      <p>{(bullets ?? []).join("|")}</p>
      <p>{notice ?? ""}</p>
      <p>{sourcePath ?? ""}</p>
    </div>
  ),
}));

const mockGetPolicyContent = getPolicyContent as jest.MockedFunction<typeof getPolicyContent>;
const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("ReturnsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["returns", "policy"]);
    mockGetPolicyContent.mockReturnValue({
      title: "Returns",
      summary: "Returns summary",
      bullets: ["30 days", "Unworn items"],
      notice: "Final-sale excluded",
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "de" }) });

    expect(metadata).toEqual({
      title: "Returns | Caryina",
      description: "Returns summary",
      keywords: ["returns", "policy"],
    });
    expect(mockGetPolicyContent).toHaveBeenCalledWith("de", "returns");
  });

  it("renders policy contract with fixed source path", async () => {
    const ui = (await ReturnsPage({
      params: Promise.resolve({ lang: "de" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("policy-page")).toBeInTheDocument();
    expect(screen.getByText("Returns")).toBeInTheDocument();
    expect(screen.getByText("30 days|Unworn items")).toBeInTheDocument();
    expect(
      screen.getByText("docs/business-os/startup-baselines/HBAG-content-packet.md"),
    ).toBeInTheDocument();
  });
});
