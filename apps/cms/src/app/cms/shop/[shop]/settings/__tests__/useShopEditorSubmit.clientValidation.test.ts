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

const mockToastMessages: { type: string; message: string }[] = [];
jest.mock("@acme/ui/operations", () => ({
  __esModule: true,
  useToast: () => ({
    success: (message: string) => { mockToastMessages.push({ type: "success", message }); },
    error: (message: string) => { mockToastMessages.push({ type: "error", message }); },
    warning: (message: string) => { mockToastMessages.push({ type: "warning", message }); },
    info: (message: string) => { mockToastMessages.push({ type: "info", message }); },
    loading: (message: string) => { mockToastMessages.push({ type: "loading", message }); },
    dismiss: () => {},
    update: () => {},
    promise: async (p: Promise<unknown>) => p,
  }),
}));

const updateShopMock = updateShop as jest.MockedFunction<typeof updateShop>;

describe("useShopEditorSubmit — client validation", () => {
  beforeEach(() => {
    mockToastMessages.length = 0;
  });

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
    expect(mockToastMessages).toContainEqual(
      expect.objectContaining({ type: "error", message: expect.stringMatching(/resolve.*validation/i) }),
    );
    expect(result.current.saving).toBe(false);
    expect(updateShopMock).not.toHaveBeenCalled();
  });
});
