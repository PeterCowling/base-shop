/** @jest-environment jsdom */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react";

import CatalogConsole from "../CatalogConsole.client";

const mockUseCatalogConsole = jest.fn();

jest.mock("../../../lib/uploaderI18n.client", () => ({
  useUploaderI18n: () => ({ t: (key: string) => key }),
}));

jest.mock("../useCatalogConsole.client", () => ({
  useCatalogConsole: () => mockUseCatalogConsole(),
}));

jest.mock("../CatalogLoginForm.client", () => ({
  CatalogLoginForm: () => <div data-testid="catalog-login-form" />,
}));

jest.mock("../CatalogProductForm.client", () => ({
  CatalogProductForm: () => <div data-testid="catalog-product-form" />,
}));

jest.mock("../EditProductFilterSelector.client", () => ({
  EditProductFilterSelector: () => <div data-testid="edit-filter-selector" />,
}));

jest.mock("../CurrencyRatesPanel.client", () => ({
  CurrencyRatesPanel: () => <div data-testid="currency-rates-panel" />,
}));

function buildConsoleState(overrides?: Record<string, unknown>) {
  return {
    session: { authenticated: true },
    uploaderMode: "internal",
    products: [],
    isCatalogLoading: false,
    selectedSlug: null,
    draft: null,
    storefront: "xa-b",
    fieldErrors: {},
    busy: false,
    autosaveInlineMessage: null,
    autosaveStatus: "unsaved",
    lastAutosaveSavedAt: null,
    actionFeedback: { login: null, draft: null },
    syncReadiness: { mode: "local" },
    token: "",
    setToken: jest.fn(),
    handleLogin: jest.fn(),
    handleSelect: jest.fn(),
    handleNew: jest.fn(),
    setDraft: jest.fn(),
    handleSave: jest.fn(),
    handleSaveAdvanceFeedback: jest.fn(),
    handleSaveWithDraft: jest.fn(),
    handleDelete: jest.fn(),
    handlePublish: jest.fn(),
    handleSync: jest.fn(),
    ...overrides,
  };
}

describe("CatalogConsole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCatalogConsole.mockReturnValue(buildConsoleState());
  });

  it("renders inline catalog and currency tabs for internal authenticated sessions", () => {
    render(<CatalogConsole monoClassName="mono" />);

    expect(screen.getByTestId("console-tab-catalog")).toHaveTextContent("screenCatalog");
    expect(screen.getByTestId("console-tab-currency")).toHaveTextContent("screenCurrencyRates");
    expect(screen.getByTestId("catalog-product-form")).toBeInTheDocument();
    expect(screen.queryByTestId("currency-rates-panel")).not.toBeInTheDocument();
  });

  it("switches between catalog and currency screens via the inline tab bar", async () => {
    render(<CatalogConsole monoClassName="mono" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("console-tab-currency"));
    });
    expect(screen.getByTestId("currency-rates-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("catalog-product-form")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("console-tab-catalog"));
    });
    expect(screen.getByTestId("catalog-product-form")).toBeInTheDocument();
    expect(screen.queryByTestId("currency-rates-panel")).not.toBeInTheDocument();
  });

  it("does not render the tab bar outside internal mode", () => {
    mockUseCatalogConsole.mockReturnValue(buildConsoleState({ uploaderMode: "cloud" }));

    render(<CatalogConsole monoClassName="mono" />);

    expect(screen.queryByTestId("console-tab-catalog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("console-tab-currency")).not.toBeInTheDocument();
  });
});
