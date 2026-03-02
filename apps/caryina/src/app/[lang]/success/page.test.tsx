import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";

import SuccessPage, { generateMetadata } from "./page";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/lib/contentPacket", () => ({
  getSeoKeywords: jest.fn(),
}));

jest.mock("./SuccessAnalytics.client", () => ({
  __esModule: true,
  default: ({ locale }: { locale: string }) => (
    <div data-cy="success-analytics">{locale}</div>
  ),
}));

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("SuccessPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["order", "success"]);
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "fr" }) });

    expect(metadata).toEqual({
      title: "Order success (fr) | Caryina",
      description: "Your Caryina order has been confirmed.",
      keywords: ["order", "success"],
    });
  });

  it("renders analytics and localized continue-shopping link", async () => {
    const ui = (await SuccessPage({
      params: Promise.resolve({ lang: "fr" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("success-analytics")).toHaveTextContent("fr");
    expect(screen.getByRole("heading", { name: "Order confirmed" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute(
      "href",
      "/fr/shop",
    );
  });
});
