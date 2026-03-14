import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords, getSupportContent } from "@/lib/contentPacket";

import SupportPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getSeoKeywords: jest.fn(),
  getSupportContent: jest.fn(),
}));

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;
const mockGetSupportContent = getSupportContent as jest.MockedFunction<typeof getSupportContent>;

describe("SupportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["support", "caryina"]);
    mockGetSupportContent.mockReturnValue({
      title: "Support",
      summary: "We are here to help.",
      channels: ["Email", "WhatsApp"],
      responseSla: "Replies within 24h.",
    });
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "it" }) });

    expect(metadata).toEqual({
      title: "Support | Caryina",
      description: "We are here to help.",
      keywords: ["support", "caryina"],
    });
  });

  it("renders support channels and response SLA", async () => {
    const ui = (await SupportPage({
      params: Promise.resolve({ lang: "it" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByRole("heading", { name: "Support" })).toBeInTheDocument();
    expect(screen.getByText("We are here to help.")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Replies within 24h.")).toBeInTheDocument();
    expect(screen.getByText("Skylar SRL")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
      "href",
      "/it/privacy",
    );
  });
});
