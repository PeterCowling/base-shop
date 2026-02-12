import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { TranslationsProvider } from "@acme/i18n";
import en from "@acme/i18n/en.json";

import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("TC-01: renders title as heading", async () => {
    const { container } = render(
      <TranslationsProvider messages={en}>
        <EmptyState title="No results found" />
      </TranslationsProvider>
    );
    const heading = screen.getByRole("heading", { name: /no results found/i });
    expect(heading).toBeInTheDocument();

  });

  it("TC-02: renders action button when provided", () => {
    render(
      <TranslationsProvider messages={en}>
        <EmptyState
          title="No results found"
          action={<button>Try again</button>}
        />
      </TranslationsProvider>
    );
    const button = screen.getByRole("button", { name: /try again/i });
    expect(button).toBeInTheDocument();
  });

  it("TC-03: renders title only without optional props", () => {
    render(
      <TranslationsProvider messages={en}>
        <EmptyState title="No results found" />
      </TranslationsProvider>
    );
    const heading = screen.getByRole("heading");
    expect(heading).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // No description text besides the title
    expect(heading.textContent).toBe("No results found");
  });
});
