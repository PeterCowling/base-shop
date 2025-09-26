// packages/ui/src/components/cms/__tests__/TopBar.client.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TopBar from "../TopBar.client";

const mockRouter = { refresh: jest.fn(), push: jest.fn() };
jest.mock("next/navigation", () => ({
  usePathname: () => "/cms/shop/s1/products",
  useRouter: () => mockRouter,
}));

jest.mock("@acme/shared-utils", () => ({ getShopFromPath: () => "s1" }));

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(() => Promise.resolve(undefined)),
}));

// Mock child components that may fetch
jest.mock("../Breadcrumbs.client", () => () => <span>Crumbs</span>);
jest.mock("../ShopSelector", () => () => <span>ShopSel</span>);
jest.mock("../NavMenu.client", () => () => <span>Menu</span>);

describe("TopBar.client", () => {
  test("shows new item actions and toggles theme", () => {
    render(<TopBar role="admin" />);

    // New product button present based on pathname
    expect(screen.getByText("New product")).toHaveAttribute("href", "/cms/shop/s1/products/new");

    // Theme toggle updates document class and localStorage
    const checkbox = screen.getByRole("checkbox", { name: /toggle theme/i });
    expect(checkbox).toBeInTheDocument();
    // Ensure deterministic initial state
    document.documentElement.classList.remove("theme-dark");
    fireEvent.click(checkbox);
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("refresh and sign out triggers router + redirect", async () => {
    mockRouter.refresh.mockClear();
    mockRouter.push.mockClear();
    const { signOut } = jest.requireMock("next-auth/react");
    render(<TopBar />);

    fireEvent.click(screen.getByText("Refresh"));
    expect(mockRouter.refresh).toHaveBeenCalled();

    await fireEvent.click(screen.getByText("Sign out"));
    expect(signOut).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
  });
});
