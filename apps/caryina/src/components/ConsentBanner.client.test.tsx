// apps/caryina/src/components/ConsentBanner.client.test.tsx
// Unit tests for ConsentBanner: TC-01 through TC-06 (TASK-01 contract).

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ConsentBanner } from "@/components/ConsentBanner.client";

const COOKIE_NAME = "consent.analytics";

const TEST_STRINGS = {
  message: "We use analytics cookies.",
  privacyLink: "privacy policy",
  cookieLink: "cookie policy",
  decline: "Decline",
  accept: "Accept",
  ariaLabel: "Cookie consent",
};

/**
 * Replace document.cookie with a simple writable string property so reads
 * and writes behave deterministically in jsdom (pattern from client.test.ts).
 */
function mockCookieAs(value: string) {
  Object.defineProperty(document, "cookie", {
    writable: true,
    configurable: true,
    value,
  });
}

beforeEach(() => {
  mockCookieAs("");
});

describe("ConsentBanner", () => {
  // TC-01: No consent.analytics cookie → banner renders with Accept and Decline.
  it("TC-01: shows banner when no consent cookie is set", async () => {
    render(<ConsentBanner lang="en" strings={TEST_STRINGS} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  // TC-02: consent.analytics=true already set → banner does not render.
  it("TC-02: hides banner when consent.analytics=true cookie is already set", async () => {
    mockCookieAs(`${COOKIE_NAME}=true`);
    render(<ConsentBanner lang="en" strings={TEST_STRINGS} />);

    // useSyncExternalStore reads the cookie synchronously; assert immediately
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // TC-03: consent.analytics=false already set → banner does not render.
  it("TC-03: hides banner when consent.analytics=false cookie is already set", async () => {
    mockCookieAs(`${COOKIE_NAME}=false`);
    render(<ConsentBanner lang="en" strings={TEST_STRINGS} />);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // TC-04: Click Accept → cookie written with "true", banner hides.
  it("TC-04: Accept writes consent.analytics=true and hides banner", async () => {
    render(<ConsentBanner lang="en" strings={TEST_STRINGS} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /accept/i }));

    expect(document.cookie).toContain(`${COOKIE_NAME}=true`);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // TC-05: Click Decline → cookie written with "false", banner hides.
  it("TC-05: Decline writes consent.analytics=false and hides banner", async () => {
    render(<ConsentBanner lang="en" strings={TEST_STRINGS} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /decline/i }));

    expect(document.cookie).toContain(`${COOKIE_NAME}=false`);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // TC-06: lang="en" → privacy and cookie links use localized routes.
  it("TC-06: policy links point to localized routes", async () => {
    render(<ConsentBanner lang="en" strings={TEST_STRINGS} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    const cookieLink = screen.getByRole("link", { name: /cookie policy/i });
    expect(privacyLink).toHaveAttribute("href", "/en/privacy");
    expect(cookieLink).toHaveAttribute("href", "/en/cookie-policy");
  });
});
