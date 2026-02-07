import { updateShop } from "@cms/actions/shops.server";
import { act,renderHook } from "@testing-library/react";

import type { MappingRow } from "@/hooks/useMappingRows";

import { useShopEditorSubmit } from "../useShopEditorSubmit";

import {
  createForm,
  createSections,
  submitEvent,
} from "./helpers/shopEditorSubmitTestUtils";

const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn(), loading: jest.fn(), dismiss: jest.fn(), update: jest.fn(), promise: jest.fn() };
jest.mock("@acme/ui/operations", () => ({
  useToast: () => mockToast,
}));

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));

const updateShopMock = updateShop as jest.MockedFunction<typeof updateShop>;

describe("useShopEditorSubmit — server validation errors", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("submits when client-valid and maps server validation errors to state", async () => {
    updateShopMock.mockResolvedValueOnce({ errors: { name: ["Required"] } });

    const sections = createSections({
      filterRows: [{ key: "size", value: "large" } as MappingRow],
      priceRows: [{ key: "en", value: "20" } as MappingRow],
      localeRows: [{ key: "banner", value: "en" } as MappingRow],
    });

    const form = createForm({
      id: "s1",
      name: "Shop",
      themeId: "theme",
      trackingProviders: ["dhl", "ups"],
    });

    const { result } = renderHook(() =>
      useShopEditorSubmit({
        shop: "s1",
        identity: sections.identity,
        localization: sections.localization,
        providers: sections.providers,
        overrides: sections.overrides,
      }),
    );

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(updateShopMock).toHaveBeenCalledTimes(1);
    expect(updateShopMock).toHaveBeenLastCalledWith(
      "s1",
      expect.any(FormData),
    );
    expect(result.current.errors).toEqual({ name: ["Required"] });
    expect(mockToast.error).toHaveBeenCalledWith(
      "We couldn't save your changes. Please review the errors and try again.",
    );
    expect(result.current.saving).toBe(false);
  });
});

