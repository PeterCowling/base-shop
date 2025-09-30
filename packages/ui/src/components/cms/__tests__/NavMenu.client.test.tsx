// packages/ui/src/components/cms/__tests__/NavMenu.client.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const router = { push: jest.fn() };
jest.mock("next/navigation", () => ({
  usePathname: () => "/cms/shop/s1/pages",
  useRouter: () => router,
}));

// Use the shared Radix dropdown mock (see jest.moduleMapper.cjs)

// Minimal i18n shim so visible text matches test expectations
const translations: Record<string, string> = {
  "nav.menu": "Menu",
  "nav.navigate": "Navigate",
  "nav.newPage": "New Page",
};
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

// Provide deterministic nav items
jest.mock("../nav/useCmsNavItems", () => ({
  useCmsNavItems: () => [
    { fullHref: "/cms/shop/s1/pages", label: "Pages", icon: "P", active: true },
    { fullHref: "/cms/shop/s1/configurator", label: "Configurator", icon: "C", active: false, isConfigurator: true },
  ],
}));

// Import the component after mocks to ensure they take effect
const NavMenu = require("../NavMenu.client").default;

describe("NavMenu.client", () => {
  test("renders shop menu, highlights active, navigates to Pages and New Page", async () => {
    const user = userEvent.setup();
    render(<NavMenu role="admin" variant="shop" />);

    // Open the menu via user interaction (ensures Radix mock toggles)
    await user.click(screen.getByRole("button", { name: /Menu/i }));

    // Active Pages item has special class and clicking navigates
    const pagesItem = (await screen.findByText("Pages")).closest('[role="menuitem"]') as HTMLElement;
    expect(pagesItem.className).toMatch(/bg-surface-3/);
    await user.click(pagesItem);
    expect(router.push).toHaveBeenCalledWith("/cms/shop/s1/pages");

    // New Page special entry is present in shop menu and navigates
    router.push.mockClear();
    await user.click(screen.getByRole("button", { name: /Menu/i }));
    const newPageItem = (await screen.findByText("New Page")).closest('[role="menuitem"]') as HTMLElement;
    await user.click(newPageItem);
    expect(router.push).toHaveBeenCalledWith("/cms/shop/s1/pages/new/page");
  });
});
