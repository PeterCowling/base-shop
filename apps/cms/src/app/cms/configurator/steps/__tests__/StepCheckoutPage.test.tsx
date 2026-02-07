import React from "react";
import { act,fireEvent, render, screen } from "@testing-library/react";

import type { ConfiguratorState } from "../../../wizard/schema";
import { ConfiguratorContext, type ConfiguratorContextValue } from "../../ConfiguratorContext";
import StepCheckoutPage from "../StepCheckoutPage";

const markComplete = jest.fn();
jest.mock("../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const apiRequest = jest.fn();
jest.mock("../../lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

jest.mock("../components/TemplateSelector", () => ({
  __esModule: true,
  default: ({ pageTemplates, onConfirm }: any) => (
    <div>
      <button
        data-testid="mock-template-confirm"
        onClick={() => onConfirm(pageTemplates[0].id, pageTemplates[0].components, pageTemplates[0])}
      >
        choose template
      </button>
    </div>
  ),
}));

jest.mock("@/components/atoms/shadcn", () => ({
  __esModule: true,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/atoms", () => ({
  __esModule: true,
  Toast: ({ open, message }: any) => (open ? <div>{message}</div> : null),
}));

jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}));

function renderWithContext(
  stateOverrides: Partial<ConfiguratorState> = {},
  props?: Partial<React.ComponentProps<typeof StepCheckoutPage>>,
) {
  const baseState = {
    shopId: "shop1",
    completed: {},
    checkoutLayout: "",
    checkoutComponents: [],
    checkoutPageId: null,
    themeDefaults: {},
    themeOverrides: {},
  } as Partial<ConfiguratorState>;

  const value: ConfiguratorContextValue = {
    state: { ...baseState, ...stateOverrides } as ConfiguratorState,
    setState: jest.fn(),
    update: jest.fn(),
    markStepComplete: jest.fn(),
    themeDefaults: {},
    themeOverrides: {},
    setThemeOverrides: jest.fn(),
    dirty: false,
    resetDirty: jest.fn(),
    saving: false,
  };

  return render(
    <ConfiguratorContext.Provider value={value}>
      <StepCheckoutPage
        pageTemplates={[
          { id: "tpl1", name: "Checkout", components: [{ type: "CheckoutSection" } as any] },
        ]}
        {...props}
      />
    </ConfiguratorContext.Provider>,
  );
}

describe("StepCheckoutPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequest.mockResolvedValue({ data: undefined, error: undefined });
  });

  it("creates a checkout page when a template is chosen", async () => {
    const setCheckoutLayout = jest.fn();
    const setCheckoutComponents = jest.fn();
    const setCheckoutPageId = jest.fn();
    const summary = {
      id: "p1",
      slug: "checkout",
      status: "draft" as const,
      updatedAt: "2025-01-01T00:00:00.000Z",
      previewPath: "/checkout",
      draftPreviewPath: "/checkout?preview=draft",
      templateId: "tpl1",
    };
    apiRequest.mockResolvedValueOnce({ data: summary, error: null });

    render(
      <StepCheckoutPage
        pageTemplates={[{ id: "tpl1", name: "Checkout", components: [{ type: "CheckoutSection" } as any] }]}
        checkoutLayout=""
        setCheckoutLayout={setCheckoutLayout}
        checkoutPageId={null}
        setCheckoutPageId={setCheckoutPageId}
        shopId="shop1"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("mock-template-confirm"));
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/cms/api/checkout-page/shop1",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ templateId: "tpl1" }),
      }),
    );
    expect(setCheckoutLayout).toHaveBeenCalledWith("tpl1");
    expect(setCheckoutPageId).toHaveBeenCalledWith("p1");
    await screen.findByText("cms.configurator.shopPage.draftSaved");
  });

  it("blocks completion until checkout dependencies are met", () => {
    renderWithContext({
      checkoutLayout: "tpl1",
      checkoutPageId: "page-1",
      completed: {},
      checkoutStatus: "draft",
    });
    expect(screen.getByTestId("save-return")).toBeDisabled();
  });

  it("allows completion when template, page, and settings are ready", () => {
    renderWithContext(
      {
        checkoutLayout: "tpl1",
        checkoutPageId: "page-1",
        completed: { "payment-provider": "complete", shipping: "complete" },
      },
      { checkoutLayout: "tpl1", checkoutPageId: "page-1" },
    );

    fireEvent.click(screen.getByTestId("save-return"));
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });
});
