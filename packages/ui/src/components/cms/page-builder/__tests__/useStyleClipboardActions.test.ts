import { renderHook, act } from "@testing-library/react";
import useStyleClipboardActions from "../hooks/useStyleClipboardActions";

jest.mock("../style/styleClipboard", () => ({
  __esModule: true,
  getStyleClipboard: jest.fn(() => null),
  setStyleClipboard: jest.fn(),
}));

const { getStyleClipboard, setStyleClipboard } = jest.requireMock("../style/styleClipboard");

describe("useStyleClipboardActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("copyStyles stores parsed overrides and emits live message", () => {
    const dispatch = jest.fn();
    const selectedComponent = { id: "x", styles: JSON.stringify({ color: { fg: "#111" } }) } as any;
    const { result } = renderHook(() =>
      useStyleClipboardActions({ selectedComponent, selectedIds: ["x"], components: [selectedComponent], dispatch })
    );

    const spy = jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);
    act(() => { result.current.copyStyles(); });
    expect(setStyleClipboard).toHaveBeenCalledWith({ color: { fg: "#111" } });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("pasteStyles applies clipboard to selected component(s)", () => {
    const dispatch = jest.fn();
    (getStyleClipboard as jest.Mock).mockReturnValue({ color: { bg: "#fff" } });
    const a = { id: "a", styles: JSON.stringify({ color: { fg: "#000" } }) } as any;
    const b = { id: "b", styles: JSON.stringify({}) } as any;

    const { result } = renderHook(() =>
      useStyleClipboardActions({ selectedComponent: a, selectedIds: ["a", "b"], components: [a, b], dispatch })
    );
    act(() => { result.current.pasteStyles(); });

    // One update per selected id
    expect(dispatch).toHaveBeenCalledTimes(2);
    const patches = dispatch.mock.calls.map((c: any[]) => c[0]);
    expect(patches.every((p: any) => p.type === "update" && typeof p.patch.styles === "string")).toBe(true);
  });
});

