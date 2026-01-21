import React from "react";
import { render, screen } from "@testing-library/react";

import MigrationsPage from "../src/app/cms/migrations/page";

const translations = {
  "cms.migrations.hero.title": "Upgrade storefronts to the latest tokens",
  "cms.migrations.actions.openConfigurator": "Open configurator",
  "cms.migrations.status.automation.tag": "Manual step",
};

const useTranslations = jest.fn();

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations,
}));

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, asChild, ...props }: any) =>
      asChild && React.isValidElement(children)
        ? React.cloneElement(children, props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    CardContent: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    Progress: ({ label }: any) =>
      React.createElement("div", { role: label ? "progressbar" : undefined }, label ?? null),
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  const translator = (key: string) => translations[key as keyof typeof translations] ?? key;
  useTranslations.mockResolvedValue(translator);
});

describe("MigrationsPage", () => {
  it("highlights manual migration workflow", async () => {
    render(await MigrationsPage());
    expect(
      screen.getByRole("heading", { name: /upgrade storefronts to the latest tokens/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open configurator/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/manual step/i)).toBeInTheDocument();
  });
});
