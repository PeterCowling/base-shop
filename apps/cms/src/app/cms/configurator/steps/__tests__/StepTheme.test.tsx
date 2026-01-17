/* eslint-env jest */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import StepTheme from "../StepTheme";
import { STORAGE_KEY } from "../../hooks/useConfiguratorPersistence";
import { useConfigurator } from "../../ConfiguratorContext";
import { useThemeLoader } from "../../hooks/useThemeLoader";
import { useThemePalette } from "../hooks/useThemePalette";
import { useThemePreviewDevice } from "../hooks/useThemePreviewDevice";
import useStepCompletion from "../../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// mocks
// ---------------------------------------------------------------------------

jest.mock("../../ConfiguratorContext", () => ({
  useConfigurator: jest.fn(),
}));

jest.mock("../../hooks/useThemeLoader", () => ({
  useThemeLoader: jest.fn(),
}));

jest.mock("../hooks/useThemePalette", () => ({
  useThemePalette: jest.fn(),
}));

jest.mock("../hooks/useThemePreviewDevice", () => ({
  useThemePreviewDevice: jest.fn(),
}));

jest.mock("../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../ThemeEditorForm", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onThemeChange }: any) => (
      <button onClick={() => onThemeChange("dark")}>select theme</button>
    ),
  };
});

jest.mock("@acme/ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  };
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const update = jest.fn();
const handleReset = jest.fn();
const markComplete = jest.fn();
const push = jest.fn();

describe("StepTheme", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useConfigurator as jest.Mock).mockReturnValue({
      state: { theme: "base" },
      update,
    });
    (useThemeLoader as jest.Mock).mockReturnValue({});
    (useThemePalette as jest.Mock).mockReturnValue({
      colorPalettes: [],
      palette: "",
      setPalette: jest.fn(),
      themeOverrides: {},
      themeDefaults: {},
      handleTokenChange: jest.fn(),
      handleReset,
    });
    (useThemePreviewDevice as jest.Mock).mockReturnValue({
      device: {},
      deviceId: "phone",
      orientation: "portrait",
      setDeviceId: jest.fn(),
      toggleOrientation: jest.fn(),
    });
    (useStepCompletion as jest.Mock).mockReturnValue([false, markComplete]);
    (useRouter as jest.Mock).mockReturnValue({ push });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: "base", themeOverrides: { foo: "bar" } })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("changes theme and updates persistence", () => {
    render(<StepTheme themes={[]} nextStepId="next" /> as any);
    fireEvent.click(screen.getByText("select theme"));
    expect(update).toHaveBeenCalledWith("theme", "dark");
    expect(handleReset).toHaveBeenCalled();
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(data.theme).toBe("dark");
    expect(data.themeOverrides).toEqual({});
  });

  it("marks complete and navigates to next step", () => {
    render(<StepTheme themes={[]} nextStepId="next" /> as any);
    fireEvent.click(screen.getByTestId("next"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator/next");
  });
});

