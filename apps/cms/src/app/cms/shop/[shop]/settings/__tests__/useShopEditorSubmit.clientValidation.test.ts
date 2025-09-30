import { renderHook, act } from "@testing-library/react";
import type { MappingRow } from "@/hooks/useMappingRows";
import { useShopEditorSubmit } from "../useShopEditorSubmit";
import { updateShop } from "@cms/actions/shops.server";
import {
  createForm,
  createSections,
  submitEvent,
} from "./helpers/shopEditorSubmitTestUtils";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));

const updateShopMock = updateShop as jest.MockedFunction<typeof updateShop>;

describe("useShopEditorSubmit — client validation", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("blocks submission when local validation fails", async () => {
    const sections = createSections({
      filterRows: [{ key: "", value: "" }],
      priceRows: [{ key: "en", value: "bad" } as MappingRow],
      localeRows: [{ key: "banner", value: "xx" } as MappingRow],
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

    const form = createForm({ id: "s1", name: "Shop", themeId: "theme" });

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(result.current.errors).toEqual({
      filterMappings: ["All filter mappings must have key and value"],
      priceOverrides: [
        "All price overrides require locale and numeric value",
      ],
      localeOverrides: [
        "All locale overrides require key and valid locale",
      ],
    });
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message: "Please resolve the highlighted validation issues.",
    });
    expect(result.current.saving).toBe(false);
    expect(updateShopMock).not.toHaveBeenCalled();

    act(() => {
      result.current.closeToast();
    });
    expect(result.current.toast.open).toBe(false);
  });
});

