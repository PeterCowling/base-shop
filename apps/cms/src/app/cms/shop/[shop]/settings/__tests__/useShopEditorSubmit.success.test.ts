import { updateShop } from "@cms/actions/shops.server";
import { act,renderHook } from "@testing-library/react";

import type { MappingRow } from "@/hooks/useMappingRows";

import { useShopEditorSubmit } from "../useShopEditorSubmit";

import {
  createForm,
  createSections,
  submitEvent,
} from "./helpers/shopEditorSubmitTestUtils";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));

const updateShopMock = updateShop as jest.MockedFunction<typeof updateShop>;

describe("useShopEditorSubmit — success flow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("applies server response to sections and shows success toast", async () => {
    const sections = createSections({
      filterRows: [{ key: "size", value: "large" } as MappingRow],
      priceRows: [{ key: "en", value: "20" } as MappingRow],
      localeRows: [{ key: "banner", value: "en" } as MappingRow],
    });

    const responseShop = {
      id: "s1",
      name: "Updated Shop",
      themeId: "theme",
      filterMappings: { size: "dimensions.size" },
      priceOverrides: { en: 42 },
      localeOverrides: { banner: "it" },
      luxuryFeatures: sections.identity.info.luxuryFeatures,
    } as any;

    updateShopMock.mockResolvedValueOnce({ shop: responseShop });

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

    expect(sections.identity.setInfo).toHaveBeenCalledWith(responseShop);
    expect(sections.providers.setTrackingProviders).toHaveBeenCalledWith([
      "dhl",
      "ups",
    ]);
    expect(
      sections.overrides.filterMappings.setRows,
    ).toHaveBeenCalledWith([{ key: "size", value: "dimensions.size" }]);
    expect(
      sections.localization.priceOverrides.setRows,
    ).toHaveBeenCalledWith([{ key: "en", value: "42" }]);
    expect(
      sections.localization.localeOverrides.setRows,
    ).toHaveBeenCalledWith([{ key: "banner", value: "it" }]);

    expect(result.current.errors).toEqual({});
    expect(result.current.toast).toEqual({
      open: true,
      status: "success",
      message: "Shop settings saved successfully.",
    });
    expect(result.current.saving).toBe(false);
  });
});

