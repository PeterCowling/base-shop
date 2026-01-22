import * as React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent,render, screen } from "@testing-library/react";

import { siteConfig } from "../../lib/siteConfig";
import { XaShell } from "../XaShell";

const setThemeMock = jest.fn();
let themeValue = "base";
let cartState: Record<string, { qty: number }> = {};
let wishlistState: string[] = [];

jest.mock("../XaMegaMenu", () => ({
  XaMegaMenu: ({ label }: { label: string }) => <div>{label}</div>,
}));

jest.mock("../XaSupportDock.client", () => ({
  XaSupportDock: () => <div data-testid="support-dock" />,
}));

jest.mock("@acme/platform-core/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: themeValue, setTheme: setThemeMock }),
}));

jest.mock("../../contexts/XaCartContext", () => ({
  useCart: () => [cartState],
}));

jest.mock("../../contexts/XaWishlistContext", () => ({
  useWishlist: () => [wishlistState],
}));

jest.mock("@acme/ui/components/organisms/AnnouncementBar", () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <div>{text}</div>,
}));

jest.mock("@acme/ui/components/molecules", () => ({
  CurrencySwitcher: () => <div data-testid="currency-switcher" />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mutableConfig = siteConfig as unknown as {
  brandName: string;
  showContactInfo: boolean;
  showSocialLinks: boolean;
  whatsappNumber: string;
};

beforeEach(() => {
  cartState = {};
  wishlistState = [];
  themeValue = "base";
  setThemeMock.mockClear();
  mutableConfig.showContactInfo = true;
  mutableConfig.showSocialLinks = true;
  mutableConfig.whatsappNumber = "+00 000 000 000";
});

describe("XaShell", () => {
  it("renders counts and WhatsApp announcement", () => {
    cartState = {
      a: { qty: 1 },
      b: { qty: 2 },
    };
    wishlistState = ["sku-1"];

    render(
      <XaShell>
        <div>Body</div>
      </XaShell>,
    );

    expect(screen.getByText("Support via WhatsApp — tap to chat")).toBeInTheDocument();
    expect(screen.getByLabelText("Wishlist (1)")).toBeInTheDocument();
    expect(screen.getByLabelText("Cart (3)")).toBeInTheDocument();
    expect(screen.getByTestId("support-dock")).toBeInTheDocument();
  });

  it("toggles theme when system preference is active", () => {
    themeValue = "system";
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    render(
      <XaShell>
        <div>Body</div>
      </XaShell>,
    );

    const toggle = screen.getByLabelText("Switch to light mode");
    fireEvent.click(toggle);
    expect(setThemeMock).toHaveBeenCalledWith("base");
  });

  it("omits support UI when links are disabled", () => {
    mutableConfig.showContactInfo = false;
    mutableConfig.showSocialLinks = false;

    render(
      <XaShell>
        <div>Body</div>
      </XaShell>,
    );

    expect(screen.queryByText("Support via WhatsApp — tap to chat")).toBeNull();
    expect(screen.queryByTestId("support-dock")).toBeNull();
  });
});
