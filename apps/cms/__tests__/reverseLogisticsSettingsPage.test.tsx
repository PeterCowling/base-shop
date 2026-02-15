import "@testing-library/jest-dom";

import type React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@cms/actions/shops.server", () => ({
  getSettings: jest.fn(),
}));

const { getSettings } = jest.requireMock("@cms/actions/shops.server") as {
  getSettings: jest.Mock;
};

jest.mock("next/dynamic", () => {
  const React = require("react");
  const MockEditor: React.FC = () => <div data-cy="editor" />;
  MockEditor.displayName = "MockEditor";
  return () => MockEditor;
});

async function loadReverseLogisticsSettingsPage() {
  const mod = await import(
    "../src/app/cms/shop/[shop]/settings/reverse-logistics/page"
  );
  return mod.default;
}

describe("ReverseLogisticsSettingsPage", () => {
  it("renders editor with settings", async () => {
    getSettings.mockResolvedValue({
      reverseLogisticsService: { enabled: true, intervalMinutes: 10 },
    });

    const ReverseLogisticsSettingsPage =
      await loadReverseLogisticsSettingsPage();
    const Page = await ReverseLogisticsSettingsPage({
      params: Promise.resolve({ shop: "s1" }),
    });

    render(Page);
    expect(screen.getByText("Reverse Logistics – s1")).toBeInTheDocument();
    expect(screen.getByTestId("editor")).toBeInTheDocument();
  });
});
