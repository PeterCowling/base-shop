import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

const getSettings = jest.fn();
const getStockCheckHistory = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ getSettings, getStockCheckHistory }));
jest.mock("next/dynamic", () => () => () => <div data-cy="editor" />);

import StockSchedulerSettingsPage from "../src/app/cms/shop/[shop]/settings/stock-scheduler/page";

describe("StockSchedulerSettingsPage", () => {
  it("renders editor with settings", async () => {
    getSettings.mockResolvedValue({ stockCheckService: { intervalMinutes: 30 } });
    getStockCheckHistory.mockResolvedValue([]);
    const Page = await StockSchedulerSettingsPage({ params: Promise.resolve({ shop: "s1" }) });
    render(Page);
    expect(screen.getByText("Stock Scheduler – s1")).toBeInTheDocument();
    expect(screen.getByTestId("editor")).toBeInTheDocument();
  });
});
