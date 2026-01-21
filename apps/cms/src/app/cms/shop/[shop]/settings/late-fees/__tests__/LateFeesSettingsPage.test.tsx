import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import LateFeesSettingsPage from "../page";

const getSettings = jest.fn();
const lateFeesEditorMock = jest.fn((_props: any) => <div data-testid="late-fees-editor" />);
const lateFeesTableMock = jest.fn((_props: any) => <div data-testid="late-fees-table" />);

jest.mock("@cms/actions/shops.server", () => ({
  getSettings: (...args: any[]) => getSettings(...args),
}));

jest.mock("next/dynamic", () => {
  return (importer: () => Promise<any>) => {
    const key = importer.toString();
    if (key.includes("LateFeesEditor")) {
      return (props: any) => lateFeesEditorMock(props);
    }

    return () => null;
  };
});

jest.mock("../LateFeesEditor", () => ({
  __esModule: true,
  default: (props: any) => lateFeesEditorMock(props),
}));

jest.mock("../LateFeesTable", () => ({
  __esModule: true,
  default: (props: any) => lateFeesTableMock(props),
}));

describe("LateFeesSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders settings when late fee service is configured", async () => {
    getSettings.mockResolvedValue({
      lateFeeService: {
        enabled: true,
        intervalMinutes: 30,
      },
    });

    const Page = await LateFeesSettingsPage({
      params: Promise.resolve({ shop: "demo-shop" }),
    });

    render(Page);

    expect(
      screen.getByRole("heading", { name: "Late Fees – demo-shop" }),
    ).toBeInTheDocument();

    expect(lateFeesEditorMock).toHaveBeenCalledTimes(1);
    expect(lateFeesEditorMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        shop: "demo-shop",
        initial: { enabled: true, intervalMinutes: 30 },
      }),
    );

    expect(lateFeesTableMock).toHaveBeenCalledTimes(1);
    expect(lateFeesTableMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ shop: "demo-shop" }),
    );

    expect(getSettings).toHaveBeenCalledWith("demo-shop");
  });

  it("falls back to defaults when settings omit the late fee service", async () => {
    getSettings.mockResolvedValue({});

    const Page = await LateFeesSettingsPage({
      params: Promise.resolve({ shop: "demo-shop" }),
    });

    render(Page);

    expect(lateFeesEditorMock).toHaveBeenCalledTimes(1);
    expect(lateFeesEditorMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        shop: "demo-shop",
        initial: { enabled: false, intervalMinutes: 60 },
      }),
    );
  });
});
