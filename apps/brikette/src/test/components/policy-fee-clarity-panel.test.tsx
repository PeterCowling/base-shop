import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (options?.returnObjects && key === "policies.items") {
        return [
          "policies.items.0",
          "policies.items.1",
          "policies.items.2",
          "policies.items.3",
          "policies.items.4",
        ];
      }
      return key;
    },
    i18n: { language: "en" },
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, prefetch: _p, ...props }: { children: ReactNode; href: string; prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock("@/utils/slug", () => ({
  getSlug: () => "terms",
}));

// eslint-disable-next-line import/first -- mocks must be declared before the import under test
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";

describe("PolicyFeeClarityPanel", () => {
  it("renders full hostel policy list", () => {
    render(<PolicyFeeClarityPanel lang="en" variant="hostel" />);

    expect(screen.getByText("policies.title")).toBeInTheDocument();
    expect(screen.getByText("policies.items.0")).toBeInTheDocument();
    expect(screen.getByText("policies.items.1")).toBeInTheDocument();
    expect(screen.getByText("policies.items.2")).toBeInTheDocument();
    expect(screen.getByText("policies.items.3")).toBeInTheDocument();
    expect(screen.getByText("policies.items.4")).toBeInTheDocument();
    expect(screen.getByText("policies.footer")).toBeInTheDocument();
    expect(screen.getByText("terms")).toBeInTheDocument();
  });

  it("filters out hostel-specific items for apartment variant", () => {
    render(<PolicyFeeClarityPanel lang="en" variant="apartment" />);

    expect(screen.getByText("policies.items.0")).toBeInTheDocument();
    expect(screen.queryByText("policies.items.1")).not.toBeInTheDocument();
    expect(screen.getByText("policies.items.2")).toBeInTheDocument();
    expect(screen.getByText("policies.items.3")).toBeInTheDocument();
    expect(screen.queryByText("policies.items.4")).not.toBeInTheDocument();
  });
});

