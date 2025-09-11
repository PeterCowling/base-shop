// apps/cms/__tests__/WizardPreview.test.tsx
/* eslint-env jest */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import WizardPreview from "../src/app/cms/wizard/WizardPreview";
import { STORAGE_KEY } from "../src/app/cms/configurator/hooks/useConfiguratorPersistence";

jest.mock("./../src/app/cms/wizard/usePreviewTokens", () => ({
  __esModule: true,
  default: () => ({})
}));

jest.mock("@ui/components/organisms", () => ({
  Footer: () => <div data-cy="footer" />, 
  Header: () => <div data-cy="header" />, 
  SideNav: () => <div data-cy="sidenav" />,
}));

jest.mock("@ui/components/templates", () => ({
  AppShell: ({ children }: any) => <div data-cy="app-shell">{children}</div>
}));

jest.mock("@/i18n/Translations", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>
}));

jest.mock("@i18n/en.json", () => ({}), { virtual: true });

jest.mock("@ui/components/cms/blocks", () => ({
  blockRegistry: {
    Mock: { component: ({ foo }: any) => <div data-cy="mock-block">{foo}</div> }
  }
}));

describe("WizardPreview", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders text and registry blocks", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        components: [
          { id: "1", type: "Text", text: "Hello" },
          { id: "2", type: "Mock", foo: "bar" }
        ]
      })
    );

    render(<WizardPreview style={{}} />);

    expect(await screen.findByText("Hello")).toBeInTheDocument();
    expect((await screen.findByTestId("mock-block")).textContent).toBe("bar");
  });

  it("skips unknown block types", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        components: [{ id: "1", type: "Unknown", foo: "baz" }]
      })
    );

    render(<WizardPreview style={{}} />);
    await screen.findByTestId("app-shell");
    expect(screen.queryByText("baz")).toBeNull();
  });

  it("reacts to storage updates", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        components: [{ id: "1", type: "Text", text: "First" }]
      })
    );

    render(<WizardPreview style={{}} />);
    await screen.findByText("First");

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        components: [{ id: "1", type: "Text", text: "Second" }]
      })
    );
    await act(async () => {
      window.dispatchEvent(new Event("storage"));
    });

    expect(await screen.findByText("Second")).toBeInTheDocument();
  });
});

