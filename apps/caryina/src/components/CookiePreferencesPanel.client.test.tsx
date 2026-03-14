import { fireEvent, render, screen } from "@testing-library/react";

import { CookiePreferencesPanel } from "@/components/CookiePreferencesPanel.client";

const COOKIE_NAME = "consent.analytics";

function mockCookieAs(value: string) {
  Object.defineProperty(document, "cookie", {
    writable: true,
    configurable: true,
    value,
  });
}

describe("CookiePreferencesPanel", () => {
  beforeEach(() => {
    mockCookieAs("");
  });

  it("shows when no preference is stored yet", () => {
    render(<CookiePreferencesPanel />);

    expect(screen.getByRole("heading", { name: "Manage analytics consent" })).toBeInTheDocument();
    expect(screen.getByText("No analytics preference has been saved yet on this browser.")).toBeInTheDocument();
  });

  it("updates status after allowing analytics cookies", () => {
    render(<CookiePreferencesPanel />);

    fireEvent.click(screen.getByRole("button", { name: /allow analytics cookies/i }));

    expect(document.cookie).toContain(`${COOKIE_NAME}=true`);
    expect(screen.getByText("Analytics cookies are currently allowed on this browser.")).toBeInTheDocument();
  });

  it("updates status after declining analytics cookies", () => {
    render(<CookiePreferencesPanel />);

    fireEvent.click(screen.getByRole("button", { name: /decline analytics cookies/i }));

    expect(document.cookie).toContain(`${COOKIE_NAME}=false`);
    expect(screen.getByText("Analytics cookies are currently declined on this browser.")).toBeInTheDocument();
  });
});
