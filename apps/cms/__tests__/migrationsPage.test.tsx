import React from "react";
import { render, screen } from "@testing-library/react";
import MigrationsPage from "../src/app/cms/migrations/page";

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

describe("MigrationsPage", () => {
  it("highlights manual migration workflow", () => {
    render(<MigrationsPage />);
    expect(
      screen.getByRole("heading", { name: /upgrade storefronts to the latest tokens/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open configurator/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/manual step/i)).toBeInTheDocument();
  });
});
