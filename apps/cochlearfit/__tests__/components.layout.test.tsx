import "~test/resetNextMocks";

import React from "react";
import * as navigation from "next/navigation";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import HtmlLangUpdater from "@/components/HtmlLangUpdater";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Shell from "@/components/layout/Shell";
import LocalePreferenceSync from "@/components/LocalePreferenceSync";

import { renderWithProviders } from "./testUtils";

describe("layout components", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("renders header navigation links", () => {
    renderWithProviders(<Header />, { withCart: true });
    const shopLinks = screen.getAllByRole("link", { name: "Shop" });
    expect(shopLinks[0]).toHaveAttribute("href", "/en/shop");
    expect(screen.getByRole("link", { name: "CochlearFit Headbands" })).toHaveAttribute(
      "href",
      "/en"
    );
  });

  it("renders footer support and policy links", () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText("hello@cochlearfit.example")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shipping" })).toHaveAttribute(
      "href",
      "/en/policies/shipping"
    );
  });

  it("renders shell with child content", () => {
    renderWithProviders(
      <Shell>
        <div>Shell content</div>
      </Shell>,
      { withCart: true }
    );

    expect(screen.getByText("Shell content")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Shop" }).length).toBeGreaterThan(0);
  });

  it("switches languages via router and storage", async () => {
    const user = userEvent.setup();
    const push = jest.fn();

    jest.spyOn(navigation, "useRouter").mockReturnValue({
      push,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
    jest.spyOn(navigation, "usePathname").mockReturnValue("/en/shop");

    renderWithProviders(<LanguageSwitcher />, { locale: "en" });

    await user.click(screen.getByRole("button", { name: "it" }));
    expect(localStorage.getItem("cochlearfit:locale")).toBe("it");
    expect(push).toHaveBeenCalledWith("/it/shop");
  });

  it("does not navigate when selecting the active locale", async () => {
    const user = userEvent.setup();
    const push = jest.fn();

    jest.spyOn(navigation, "useRouter").mockReturnValue({
      push,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
    jest.spyOn(navigation, "usePathname").mockReturnValue("/en/shop");

    renderWithProviders(<LanguageSwitcher />, { locale: "en" });

    await user.click(screen.getByRole("button", { name: "en" }));
    expect(push).not.toHaveBeenCalled();
  });

  it("syncs preferred locale when needed", async () => {
    localStorage.setItem("cochlearfit:locale", "it");
    const replace = jest.fn();

    jest.spyOn(navigation, "useRouter").mockReturnValue({
      push: jest.fn(),
      replace,
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
    jest.spyOn(navigation, "usePathname").mockReturnValue("/en/contact");

    renderWithProviders(<LocalePreferenceSync />, { locale: "en" });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/it/contact");
    });
  });

  it("updates document language from path", async () => {
    jest.spyOn(navigation, "usePathname").mockReturnValue("/it/faq");
    render(<HtmlLangUpdater />);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("it");
    });
  });

  it("defaults document language when pathname is missing", async () => {
    jest.spyOn(navigation, "usePathname").mockReturnValue(undefined);
    render(<HtmlLangUpdater />);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
    });
  });
});
