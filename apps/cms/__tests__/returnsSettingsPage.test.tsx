import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

const getSettings = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({ getSettings }));
jest.mock("next/dynamic", () => () => () => <div data-cy="editor" />);

import ReturnsSettingsPage from "../src/app/cms/shop/[shop]/settings/returns/page";

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
