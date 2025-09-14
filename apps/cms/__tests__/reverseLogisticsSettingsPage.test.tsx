import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

const getSettings = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ getSettings }));
jest.mock("next/dynamic", () => () => () => <div data-cy="editor" />);

import ReverseLogisticsSettingsPage from "../src/app/cms/shop/[shop]/settings/reverse-logistics/page";

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
