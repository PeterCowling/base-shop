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

describe("useShopEditorSubmit — unexpected failure", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows generic error toast and keeps errors empty on exception", async () => {
    updateShopMock.mockRejectedValueOnce(new Error("Network error"));

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

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    consoleError.mockRestore();

    expect(updateShopMock).toHaveBeenCalledTimes(1);
    expect(updateShopMock).toHaveBeenLastCalledWith(
      "s1",
      expect.any(FormData),
    );
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message:
        "Something went wrong while saving your changes. Please try again.",
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.saving).toBe(false);
  });
});

