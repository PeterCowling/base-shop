// apps/cover-me-pretty/__tests__/not-found.test.tsx
import type React from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

interface MockLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
}

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: MockLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { render, screen } from "@testing-library/react";
import NotFoundClient from "../src/app/not-found.client";
import NotFound from "../src/app/not-found";
import NotFoundContent from "../src/components/NotFoundContent";

describe("NotFound", () => {
  it("renders client messages and CTA", () => {
    render(<NotFoundClient />);
    expect(
      screen.getByRole("heading", { name: "Page not found" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The page you're looking for doesn't exist or has moved."
      )
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Go to homepage" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("server wrapper returns NotFoundContent", () => {
    // Cast to bypass TS expecting params on server components
    const element = (NotFound as unknown as () => React.ReactElement)();
    expect(element).not.toBeNull();
    expect(element.type).toBe(NotFoundContent);
  });
});
