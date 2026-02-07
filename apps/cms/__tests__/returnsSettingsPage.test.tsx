import "@testing-library/jest-dom";

import type React from "react";
import { render, screen } from "@testing-library/react";

import ReturnsSettingsPage from "../src/app/cms/shop/[shop]/settings/returns/page";

const getSettings = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ getSettings }));
jest.mock("next/dynamic", () => {
  const React = require("react");
  const MockEditor: React.FC = () => <div data-cy="editor" />;
  MockEditor.displayName = "MockEditor";
  return () => MockEditor;
});

describe("ReturnsSettingsPage", () => {
  it("renders editor with settings", async () => {
    getSettings.mockResolvedValue({
      returnService: { upsEnabled: true, bagEnabled: true, homePickupEnabled: false },
    });
    const Page = await ReturnsSettingsPage({ params: Promise.resolve({ shop: "s1" }) });
    render(Page);
    expect(screen.getByText("Returns – s1")).toBeInTheDocument();
    expect(screen.getByTestId("editor")).toBeInTheDocument();
  });
});
