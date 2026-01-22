import { act,renderHook } from "@testing-library/react";

import useGlobals from "@acme/ui/components/cms/page-builder/hooks/useGlobals";

jest.mock("next/navigation", () => ({ usePathname: () => "/cms/shop/demo" }));
jest.mock("../libraryStore", () => ({
  __esModule: true,
  listGlobals: jest.fn(() => []),
  saveGlobal: jest.fn(async () => {}),
  updateGlobal: jest.fn(async () => {}),
}));

const { listGlobals, saveGlobal, updateGlobal } = jest.requireMock("../libraryStore");

jest.mock("ulid", () => ({ ulid: () => "ULID" }));
jest.mock("@acme/platform-core/validation/templateValidation", () => ({
  __esModule: true,
  validateTemplateCreation: () => ({ ok: true }),
}));

describe("useGlobals", () => {
  const comp = { id: "a", type: "Text", name: "Title", children: [] } as any;
  const other = { id: "b", type: "Image" } as any;
  const tree = [comp, other];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads globals list and makeGlobal saves + updates editor", async () => {
    const dispatch = jest.fn();
    (listGlobals as jest.Mock).mockReturnValueOnce([]);
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("Hero");

    const { result } = renderHook(() => useGlobals({ components: tree, editor: {}, dispatch, selectedComponent: comp }));
    await act(async () => { await result.current.makeGlobal(); });

    expect(saveGlobal).toHaveBeenCalledWith("demo", expect.objectContaining({ label: "Hero", globalId: expect.stringContaining("gid_") }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "update-editor", id: "a" }));
    promptSpy.mockRestore();
  });

  it("editGlobally alerts if not linked; updates when linked and confirmed", async () => {
    const dispatch = jest.fn();
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    // not linked: alerts
    const { result: r1 } = renderHook(() => useGlobals({ components: tree, editor: {}, dispatch, selectedComponent: comp }));
    await act(async () => { await r1.current.editGlobally(); });
    expect(alertSpy).toHaveBeenCalled();

    // linked: updates + set dispatch
    const editor = { a: { global: { id: "gid_existing" } } } as any;
    const { result } = renderHook(() => useGlobals({ components: tree, editor, dispatch, selectedComponent: comp }));
    await act(async () => { await result.current.editGlobally(); });
    expect(updateGlobal).toHaveBeenCalledWith("demo", "gid_existing", expect.objectContaining({ template: comp }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "set" }));

    alertSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  it("insertGlobal clones template, adds and links editor state", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useGlobals({ components: tree, editor: {}, dispatch, selectedComponent: comp }));
    act(() => { result.current.setInsertOpen(true); });
    act(() => { result.current.insertGlobal({ globalId: "gid_1", label: "X", template: comp } as any); });
    // Two dispatches: add and update-editor
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[0][0]).toEqual(expect.objectContaining({ type: "add" }));
    expect(dispatch.mock.calls[1][0]).toEqual(expect.objectContaining({ type: "update-editor" }));
  });
});
