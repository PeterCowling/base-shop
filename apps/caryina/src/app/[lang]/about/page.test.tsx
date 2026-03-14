import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getAboutContent, getSeoKeywords } from "@/lib/contentPacket";

import AboutPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getAboutContent: jest.fn(),
  getSeoKeywords: jest.fn(),
}));

const mockGetAboutContent = getAboutContent as jest.MockedFunction<typeof getAboutContent>;
const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("AboutPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["bag charm", "caryina"]);
    mockGetAboutContent.mockReturnValue({
      title: "About Caryina",
      eyebrow: "Designed in Positano, Italy",
      summary: "Caryina designs bag charms in Positano.",
      paragraphs: ["First paragraph about Caryina.", "Second paragraph about Caryina."],
    });
  });

  it("generates localized metadata with title, description and keywords", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "en" }) });

    expect(metadata).toEqual({
      title: "About Caryina | Caryina",
      description: "Caryina designs bag charms in Positano.",
      keywords: ["bag charm", "caryina"],
    });
  });

  it("renders the page heading and eyebrow", async () => {
    const ui = (await AboutPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByRole("heading", { name: "About Caryina" })).toBeInTheDocument();
    expect(screen.getByText("Designed in Positano, Italy")).toBeInTheDocument();
  });

  it("renders all paragraphs", async () => {
    const ui = (await AboutPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByText("First paragraph about Caryina.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph about Caryina.")).toBeInTheDocument();
  });

  it("uses locale param when calling content accessors", async () => {
    await generateMetadata({ params: Promise.resolve({ lang: "de" }) });
    expect(mockGetAboutContent).toHaveBeenCalledWith("de");
  });
});
