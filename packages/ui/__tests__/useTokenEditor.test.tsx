import { useState } from "react";
import { act, render,renderHook } from "@testing-library/react";

import { type TokenMap,useTokenEditor } from "../src/hooks/useTokenEditor";

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  readAsDataURL(_: File) {
    this.result = "data:font/mock";
    this.onload?.();
  }
}

describe("useTokenEditor", () => {
  beforeEach(() => {
    (global as any).FileReader = MockFileReader as any;
    document.head.innerHTML = "";
  });

  it("setToken updates tokens and triggers onChange", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useTokenEditor({ "--color-a": "red" }, { "--color-a": "red" }, onChange)
    );
    act(() => result.current.setToken("--color-a", "blue"));
    expect(onChange).toHaveBeenCalledWith({ "--color-a": "blue" });
  });

  it("marks tokens overridden relative to base tokens", () => {
    const { result } = renderHook(() =>
      useTokenEditor({ "--color-a": "blue" }, { "--color-a": "red" }, () => {})
    );
    expect(result.current.colors[0]).toMatchObject({
      key: "--color-a",
      defaultValue: "red",
      isOverridden: true,
      value: "blue",
    });
  });

  it("handleUpload sets tokens and font arrays for mono and sans", async () => {
    let upload!: ReturnType<typeof useTokenEditor>["handleUpload"];
    let getSans!: () => string[];
    let getMono!: () => string[];
    const onChange = jest.fn();

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({});
      const hook = useTokenEditor(tokens, {}, (t) => {
        setTokens((prev) => ({ ...prev, ...t }));
        onChange(t);
      });
      upload = hook.handleUpload;
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
      return null;
    }

    render(<Wrapper />);

    const monoFile = new File(["a"], "MonoFont.woff", { type: "font/woff" });
    await act(async () => {
      upload("mono", { target: { files: [monoFile], value: "" } } as any);
    });

    expect(onChange).toHaveBeenNthCalledWith(1, {
      "--font-src-MonoFont": "data:font/mock",
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      "--font-mono": '"MonoFont"',
    });
    expect(getMono()).toContain('"MonoFont"');

    const sansFile = new File(["b"], "SansFont.otf", { type: "font/otf" });
    await act(async () => {
      upload("sans", { target: { files: [sansFile], value: "" } } as any);
    });

    expect(onChange.mock.calls[2][0]).toMatchObject({
      "--font-src-SansFont": "data:font/mock",
    });
    expect(onChange.mock.calls[3][0]).toMatchObject({
      "--font-sans": '"SansFont"',
    });
    expect(getSans()).toContain('"SansFont"');
  });

  it("addCustomFont ignores blanks, avoids duplicates, and clears newFont", () => {
    let add!: () => void;
    let setNF!: (v: string) => void;
    let getSans!: () => string[];
    let getMono!: () => string[];
    let getNF!: () => string;

    function Wrapper() {
      const hook = useTokenEditor({}, {}, () => {});
      add = hook.addCustomFont;
      setNF = hook.setNewFont;
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
      getNF = () => hook.newFont;
      return null;
    }

    render(<Wrapper />);

    const sansLen = getSans().length;
    const monoLen = getMono().length;

    act(() => add());
    expect(getSans().length).toBe(sansLen);
    expect(getMono().length).toBe(monoLen);

    act(() => setNF("Fancy"));
    act(() => add());

    expect(getSans()).toContain("Fancy");
    expect(getMono()).toContain("Fancy");
    expect(getNF()).toBe("");

    act(() => setNF("Fancy"));
    act(() => add());
    expect(getSans().filter((f) => f === "Fancy")).toHaveLength(1);
  });

  it("setGoogleFont loads fonts only once and updates tokens correctly", () => {
    let setGoogleFont!: ReturnType<typeof useTokenEditor>["setGoogleFont"];
    let getSans!: () => string[];
    let getMono!: () => string[];
    const onChange = jest.fn();

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({});
      const hook = useTokenEditor(tokens, {}, (t) => {
        setTokens((prev) => ({ ...prev, ...t }));
        onChange(t);
      });
      setGoogleFont = hook.setGoogleFont;
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
      return null;
    }

    render(<Wrapper />);

    act(() => setGoogleFont("mono", "Roboto"));

    expect(onChange.mock.calls[0][0]).toEqual({
      "--font-mono": '"Roboto", var(--font-mono)',
    });
    expect(getMono()).toContain('"Roboto", var(--font-mono)');
    expect(getSans()).not.toContain('"Roboto", var(--font-mono)');
    expect(document.querySelectorAll("link#google-font-Roboto")).toHaveLength(1);

    act(() => setGoogleFont("mono", "Roboto"));
    expect(document.querySelectorAll("link#google-font-Roboto")).toHaveLength(1);

    act(() => setGoogleFont("sans", "Inter"));

    expect(onChange.mock.calls[2][0]).toMatchObject({
      "--font-sans": '"Inter", var(--font-sans)',
    });
    expect(getSans()).toContain('"Inter", var(--font-sans)');
    expect(getMono()).not.toContain('"Inter", var(--font-sans)');
    expect(document.querySelectorAll("link#google-font-Inter")).toHaveLength(1);
  });

  it("injects style tags and updates stacks from initial font src tokens", () => {
    const tokens: TokenMap = {
      "--font-src-Custom": "data:font/mock",
    };
    const { result } = renderHook(() => useTokenEditor(tokens, {}, () => {}));

    expect(document.getElementById("font-Custom")).toBeTruthy();
    expect(result.current.sansFonts).toContain('"Custom"');
    expect(result.current.monoFonts).toContain('"Custom"');
  });
});
