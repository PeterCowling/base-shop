import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";

import CancelledPage, { generateMetadata } from "./page";

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

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("CancelledPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["checkout", "cancelled"]);
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "de" }) });

    expect(metadata).toEqual({
      title: "Checkout cancelled (de) | Caryina",
      description: "Checkout was cancelled before payment confirmation.",
      keywords: ["checkout", "cancelled"],
    });
  });

  it("renders localized cart and shop links", async () => {
    const ui = (await CancelledPage({
      params: Promise.resolve({ lang: "de" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByRole("heading", { name: "Payment cancelled" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to cart" })).toHaveAttribute(
      "href",
      "/de/cart",
    );
    expect(screen.getByRole("link", { name: "Back to shop" })).toHaveAttribute(
      "href",
      "/de/shop",
    );
  });
});
