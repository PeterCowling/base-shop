import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { siteConfig } from "../../lib/siteConfig";

let cartState: Record<string, { qty: number; sku: { title?: string } }> = {};
let XaSupportDock: typeof import("../XaSupportDock.client").XaSupportDock;
const mutableConfig = siteConfig as unknown as {
  brandName: string;
  showContactInfo: boolean;
  showSocialLinks: boolean;
  whatsappNumber: string;
  supportEmail: string;
  instagramUrl: string;
};

beforeEach(() => {
  cartState = {};
  mutableConfig.showContactInfo = true;
  mutableConfig.showSocialLinks = true;
  mutableConfig.whatsappNumber = "+00 000 000 000";
  mutableConfig.supportEmail = "support@example.com";
  mutableConfig.instagramUrl = "https://instagram.com/xa";
});

beforeAll(async () => {
  jest.doMock("next/navigation", () => ({
    usePathname: () => "/products/sku-1",
  }));
  jest.doMock("next/dynamic", () => ({
    __esModule: true,
    default: () => () => <div>FAQ content</div>,
  }));
  jest.doMock("@platform-core/contexts/CurrencyContext", () => ({
    useCurrency: () => ["EUR", jest.fn()],
  }));
  jest.doMock("../../contexts/XaCartContext", () => ({
    useCart: () => [cartState],
  }));
  ({ XaSupportDock } = await import("../XaSupportDock.client"));
});

describe("XaSupportDock", () => {
  it("returns null when all support channels are disabled", () => {
    mutableConfig.showContactInfo = false;
    mutableConfig.showSocialLinks = false;

    const { container } = render(<XaSupportDock />);
    expect(container.firstChild).toBeNull();
  });

  it("opens external support channels", () => {
    cartState = {
      line: { qty: 1, sku: { title: "Sample" } },
    };
    const openMock = jest.fn();
    const originalOpen = window.open;
    window.open = openMock;
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    render(<XaSupportDock />);

    fireEvent.click(screen.getByLabelText("WhatsApp"));
    expect(openMock).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/"),
      "_blank",
      "noopener,noreferrer",
    );

    fireEvent.click(screen.getByLabelText("Email"));
    expect(window.location.href).toContain("mailto:");

    fireEvent.click(screen.getByLabelText("Instagram"));
    expect(openMock).toHaveBeenCalledWith(
      "https://instagram.com/xa",
      "_blank",
      "noopener,noreferrer",
    );

    window.open = originalOpen;
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });
});
