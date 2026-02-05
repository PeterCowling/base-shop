import "@testing-library/jest-dom";

import React from "react";
import { render, waitFor } from "@testing-library/react";

const preloadI18nNamespacesMock = jest.fn<Promise<void>, [string, readonly string[], { optional: boolean }]>(
  () => Promise.resolve(),
);

jest.mock("@/utils/loadI18nNs", () => ({
  preloadI18nNamespaces: (...args: [string, readonly string[], { optional: boolean }]) =>
    preloadI18nNamespacesMock(...args),
  preloadNamespacesWithFallback: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/utils/prefetchInteractive", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
  shouldPrefetchInteractiveBundlesOnIdle: jest.fn(() => false),
}));

jest.mock("@acme/ui/molecules", () => ({
  NotificationBanner: () => null,
}));

jest.mock("@acme/ui/organisms/Header", () => ({
  Header: () => null,
}));

jest.mock("@/components/footer/Footer", () => ({
  Footer: () => null,
}));

jest.mock("@/hooks/useWebVitals", () => ({
  useWebVitals: () => undefined,
}));

jest.mock("@/hooks/useProtectBrandName", () => ({
  useProtectBrandName: () => undefined,
}));

import AppLayout from "@/components/layout/AppLayout";
import { APP_I18N_NAMESPACES, CORE_LAYOUT_I18N_NAMESPACES } from "@/i18n.namespaces";

describe("<AppLayout /> i18n preload", () => {
  beforeEach(() => {
    preloadI18nNamespacesMock.mockClear();
  });

  it("preloads only core layout namespaces (not all APP_I18N_NAMESPACES)", async () => {
    render(
      <AppLayout lang="en">
        <div>child</div>
      </AppLayout>,
    );

    await waitFor(() => expect(preloadI18nNamespacesMock).toHaveBeenCalled());

    expect(preloadI18nNamespacesMock).toHaveBeenCalledTimes(1);
    expect(preloadI18nNamespacesMock).toHaveBeenCalledWith("en", CORE_LAYOUT_I18N_NAMESPACES, {
      optional: true,
    });
    expect(preloadI18nNamespacesMock).not.toHaveBeenCalledWith("en", APP_I18N_NAMESPACES, {
      optional: true,
    });
  });
});
