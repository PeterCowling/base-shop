import { act,renderHook } from "@testing-library/react";

import useLibraryActions from "@acme/ui/components/cms/page-builder/hooks/useLibraryActions";

jest.mock("next/navigation", () => ({ usePathname: () => "/cms/shop/demo" }));
jest.mock("../libraryStore", () => ({
  __esModule: true,
  saveLibrary: jest.fn(async () => {}),
}));

const { saveLibrary } = jest.requireMock("../libraryStore");
jest.mock("ulid", () => ({ ulid: () => "LIB_ID" }));

describe("useLibraryActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves top-level selection to library with prompts", () => {
    // jsdom does not implement canvas; stub getContext to avoid exceptions
    const gc = jest
      .spyOn(HTMLCanvasElement.prototype as any, "getContext")
      .mockReturnValue(null);
    const dispatch = jest.fn();
    // Tree: parent -> child; select both, should include only the parent once
    const child = { id: "c", type: "Text" } as any;
    const parent = { id: "p", type: "Section", children: [child] } as any;
    const components = [parent];

    const promptSpy = jest
      .spyOn(window, "prompt")
      .mockImplementationOnce(() => "My Block") // label
      .mockImplementationOnce(() => "tag1, tag2"); // tags

    const { result } = renderHook(() => useLibraryActions({ components, selectedIds: ["p", "c"] }));
    act(() => { result.current.saveSelectionToLibrary(); });

    expect(saveLibrary).toHaveBeenCalledWith("demo", expect.objectContaining({ label: "My Block" }));
    promptSpy.mockRestore();
    gc.mockRestore();
  });
});
