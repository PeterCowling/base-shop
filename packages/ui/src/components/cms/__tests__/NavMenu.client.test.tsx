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
  test("renders menu and handles item selection + configurator side-effect", async () => {
    const user = userEvent.setup();
    const onStart = jest.fn(() => Promise.resolve());
    render(<NavMenu role="admin" variant="shop" onConfiguratorStartNew={onStart} />);

    // Open the menu via user interaction (ensures Radix mock toggles)
    await user.click(screen.getByRole("button", { name: /Menu/i }));

    // Active item has special class and clicking navigates
    const pagesItem = (await screen.findByText("Pages")).closest('[role="menuitem"]') as HTMLElement;
    expect(pagesItem.className).toMatch(/bg-surface-3/);
    await user.click(pagesItem);
    expect(router.push).toHaveBeenCalledWith("/cms/shop/s1/pages");

    // Configurator item invokes callback then navigates
    router.push.mockClear();
    // Re-open the menu after previous selection closed it
    await user.click(screen.getByRole("button", { name: /Menu/i }));
    await user.click(((await screen.findByText("Configurator")).closest('[role="menuitem"]') as HTMLElement));
    expect(onStart).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/cms/shop/s1/configurator");
  });
});
