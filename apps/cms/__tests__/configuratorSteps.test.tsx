import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import StepEnvVars from "../src/app/cms/configurator/steps/StepEnvVars";
import StepHomePage from "../src/app/cms/configurator/steps/StepHomePage";
import StepOptions from "../src/app/cms/configurator/steps/StepOptions";
import StepSeedData from "../src/app/cms/configurator/steps/StepSeedData";
import StepSummary from "../src/app/cms/configurator/steps/StepSummary";
import StepTheme from "../src/app/cms/configurator/steps/StepTheme";
import StepTokens from "../src/app/cms/configurator/steps/StepTokens";

// ---------------------------------------------------------------------------
// shared mocks
// ---------------------------------------------------------------------------
const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

const markComplete = jest.fn();
jest.mock("../src/app/cms/configurator/hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

jest.mock("@/components/atoms/shadcn", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  Select: ({ value, onValueChange, children }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      data-cy="select"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: () => null,
}));
jest.mock("@acme/design-system/shadcn", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  Select: ({ value, onValueChange, children }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      data-cy="select"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: () => null,
}));

jest.mock("@/components/atoms", () => ({
  Tooltip: ({ children }: any) => <span>{children}</span>,
  Toast: ({ open, message }: any) => (open ? <div>{message}</div> : null),
}));

jest.mock("../src/app/cms/configurator/components/TemplateSelector", () => ({
  __esModule: true,
  default: ({ onConfirm }: any) => (
    <button onClick={() => onConfirm("layout", [])}>choose template</button>
  ),
}));

jest.mock("@/components/cms/PageBuilder", () => ({
  __esModule: true,
  default: () => <div>builder</div>,
}));

jest.mock("../src/app/cms/configurator/hooks/useThemeLoader", () => ({
  useThemeLoader: () => ({}),
}));

jest.mock(
  "../src/app/cms/configurator/steps/hooks/useThemePalette",
  () => ({
    useThemePalette: () => ({
      colorPalettes: [],
      palette: "",
      setPalette: jest.fn(),
      themeOverrides: {},
      themeDefaults: {},
      handleTokenChange: jest.fn(),
      handleReset: jest.fn(),
    }),
  }),
);

jest.mock(
  "../src/app/cms/configurator/steps/hooks/useThemePreviewDevice",
  () => ({
    useThemePreviewDevice: () => ({
      device: {},
      deviceId: "phone",
      orientation: "portrait",
      setDeviceId: jest.fn(),
      toggleOrientation: jest.fn(),
    }),
  }),
);

jest.mock("../src/app/cms/configurator/steps/ThemeEditorForm", () => ({
  __esModule: true,
  default: ({ onThemeChange }: any) => (
    <button onClick={() => onThemeChange("dark")}>select theme</button>
  ),
}));

jest.mock("@acme/cms-ui/StyleEditor", () => ({
  __esModule: true,
  default: () => <div data-cy="style-editor">editor</div>,
}));

jest.mock("../src/app/cms/wizard/WizardPreview", () => ({
  __esModule: true,
  default: (props: any) => <div data-cy="preview" {...props} />,
}));

jest.mock("../src/app/cms/wizard/TokenInspector", () => ({
  __esModule: true,
  default: ({ children, onTokenSelect }: any) => (
    <div>
      <button onClick={() => onTokenSelect("color")}>select token</button>
      {children}
    </div>
  ),
}));

jest.mock("../src/app/cms/wizard/PreviewDeviceSelector", () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <button onClick={() => onChange({})}>device</button>
  ),
}));

let configurator: any;
jest.mock("../src/app/cms/configurator/ConfiguratorContext", () => ({
  useConfigurator: () => configurator,
}));

beforeEach(() => {
  jest.clearAllMocks();
  configurator = {
    state: {
      env: {},
      shopId: "shop",
      payment: [],
      shipping: [],
      analyticsProvider: "",
      analyticsId: "",
      theme: "",
      themeDefaults: {},
      themeOverrides: {},
      categoriesText: "",
      pageTitle: { en: "" },
      pageDescription: { en: "" },
      completed: {},
    },
    update: jest.fn((k: string, v: any) => {
      configurator.state[k] = v;
    }),
    markStepComplete: jest.fn(),
    themeDefaults: {},
    themeOverrides: {},
    setThemeOverrides: jest.fn(),
    resetDirty: jest.fn(),
  };
});

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

describe("StepEnvVars", () => {
  it("updates env vars and marks complete", () => {
    const setEnv = jest.fn();
    render(<StepEnvVars env={{}} setEnv={setEnv} />);
    const input = screen.getByPlaceholderText("STRIPE_SECRET_KEY");
    fireEvent.change(input, { target: { value: "sk" } });
    expect(setEnv).toHaveBeenCalledWith("STRIPE_SECRET_KEY", "sk");
    fireEvent.click(screen.getByText("Save & return"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

describe("StepOptions", () => {
  it("selects analytics provider and saves", () => {
    render(<StepOptions {...{} as any} />);
    fireEvent.change(screen.getByTestId("select"), {
      target: { value: "ga" },
    });
    expect(configurator.state.analyticsProvider).toBe("ga");
    fireEvent.change(screen.getByPlaceholderText("Measurement ID"), {
      target: { value: "id" },
    });
    fireEvent.click(screen.getByText("Save & return"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

describe("StepSeedData", () => {
  it("handles file input and seeding", async () => {
    const seed = jest.fn();
    const setCsvFile = jest.fn();
    const setCategoriesText = jest.fn();
    render(
      <StepSeedData
        setCsvFile={setCsvFile}
        categoriesText=""
        setCategoriesText={setCategoriesText}
        seedResult={null}
        seeding={false}
        seed={seed}
      />,
    );
    const fileInput = screen.getByLabelText("Product CSV");
    const file = new File(["a"], "a.csv", { type: "text/csv" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(setCsvFile).toHaveBeenCalled();
    fireEvent.change(
      screen.getByPlaceholderText("Shoes, Shirts, Accessories"),
      { target: { value: "Shoes" } },
    );
    expect(setCategoriesText).toHaveBeenCalledWith("Shoes");
    fireEvent.click(screen.getByText("Save & return"));
    await waitFor(() => expect(seed).toHaveBeenCalled());
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

describe("StepTheme", () => {
  it("changes theme and navigates next", () => {
    render(
      <StepTheme themes={[]} prevStepId="prev" nextStepId="next" {...{} as any} />,
    );
    fireEvent.click(screen.getByText("select theme"));
    expect(configurator.state.theme).toBe("dark");
    fireEvent.click(screen.getByText("Next"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator/next");
  });
});

describe("StepTokens", () => {
  it("selects a pairing and saves", () => {
    configurator.state.themeDefaults = { "--font-sans": "system-ui" } as any;
    render(<StepTokens {...{} as any} />);
    // Click the first available pairing button in the list
    const useButtons = screen.getAllByText("Use pairing");
    expect(useButtons.length).toBeGreaterThan(0);
    fireEvent.click(useButtons[0]);
    // Save & return
    fireEvent.click(screen.getByText("Save & return"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

describe("StepSummary", () => {
  it("renders errors and saves", async () => {
    const setPageTitle = jest.fn();
    const setPageDescription = jest.fn();
    const setSocialImage = jest.fn();
    const submit = jest.fn();
    render(
      <StepSummary
        shopId="shop"
        name="Shop"
        logo={{}}
        contactInfo=""
        type="sale"
        theme="thm"
        payment={[]}
        shipping={[]}
        analyticsProvider=""
        pageTitle={{ en: "", de: "", it: "" }}
        setPageTitle={setPageTitle}
        pageDescription={{ en: "", de: "", it: "" }}
        setPageDescription={setPageDescription}
        socialImage=""
        setSocialImage={setSocialImage}
        result={null}
        themeStyle={{}}
        creating={false}
        submit={submit}
        errors={{ "pageTitle.en": ["Required"] }}
      />,
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save & return"));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

describe("StepHomePage", () => {
  it("marks complete on next", () => {
    render(
      <StepHomePage
        pageTemplates={[]}
        homeLayout="basic"
        setHomeLayout={jest.fn()}
        components={[{ type: "hero", id: "1" }]}
        setComponents={jest.fn()}
        homePageId="page-1"
        setHomePageId={jest.fn()}
        shopId="shop"
        themeStyle={{}}
        nextStepId="next"
      />,
    );
    fireEvent.click(screen.getByText("Next"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator/next");
  });
});
