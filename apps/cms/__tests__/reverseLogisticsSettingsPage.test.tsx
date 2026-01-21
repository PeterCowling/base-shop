import "@testing-library/jest-dom";

import type React from "react";
import { render, screen } from "@testing-library/react";

import ReverseLogisticsSettingsPage from "../src/app/cms/shop/[shop]/settings/reverse-logistics/page";

const getSettings = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ getSettings }));
jest.mock("next/dynamic", () => {
  const React = require("react");
  const MockEditor: React.FC = () => <div data-cy="editor" />;
  MockEditor.displayName = "MockEditor";
  return () => MockEditor;
});

describe("ReverseLogisticsSettingsPage", () => {
  it("renders editor with settings", async () => {
    getSettings.mockResolvedValue({
      reverseLogisticsService: { enabled: true, intervalMinutes: 10 },
    });
    const Page = await ReverseLogisticsSettingsPage({
      params: Promise.resolve({ shop: "s1" }),
    });
    render(Page);
    expect(screen.getByText("Reverse Logistics – s1")).toBeInTheDocument();
    expect(screen.getByTestId("editor")).toBeInTheDocument();
  });
});
