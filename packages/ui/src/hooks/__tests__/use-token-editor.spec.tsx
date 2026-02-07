import { type ChangeEvent,useState } from "react";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { act, render } from "@testing-library/react";

import { type TokenMap,useTokenEditor } from "../useTokenEditor";

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  readAsDataURL(_: File) {
    this.result = "data:font/mock";
    this.onload?.();
  }
}

describe("useTokenEditor", () => { // i18n-exempt: test description
  beforeEach(() => {
    (globalThis as unknown as { FileReader: typeof FileReader }).FileReader =
      MockFileReader as unknown as typeof FileReader;
    document.head.innerHTML = "";
  });

  it("handleUpload returns early without a file", () => { // i18n-exempt: test description
    const onChange = jest.fn();
    let upload: ReturnType<typeof useTokenEditor>["handleUpload"];

    function Wrapper() {
      const hook = useTokenEditor({}, {}, onChange);
      upload = hook.handleUpload;
      return null;
    }

    render(<Wrapper />);
    act(() => upload("mono", { target: { files: [] } } as unknown as ChangeEvent<HTMLInputElement>));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("handleUpload sets tokens and font arrays for mono and sans", async () => { // i18n-exempt: test description
    let upload!: ReturnType<typeof useTokenEditor>["handleUpload"]; // !
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
      upload(
        "mono",
        { target: { files: [monoFile], value: "" } } as unknown as ChangeEvent<HTMLInputElement>
      );
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
      upload(
        "sans",
        { target: { files: [sansFile], value: "" } } as unknown as ChangeEvent<HTMLInputElement>
      );
    });

    expect(onChange.mock.calls[2][0]).toMatchObject({
      "--font-src-SansFont": "data:font/mock",
    });
    expect(onChange.mock.calls[3][0]).toMatchObject({
      "--font-sans": '"SansFont"',
    });
    expect(getSans()).toContain('"SansFont"');
  });

  it("classifies tokens into colors, fonts, and others", () => { // i18n-exempt: test description
    function Wrapper() {
      const { colors, fonts, others } = useTokenEditor(
        {
          "--color-a": "blue", // i18n-exempt: test data
          "--font-sans": "var(--font-sans)", // i18n-exempt: use token value to avoid raw font
          "--gap": "2rem", // i18n-exempt: test data
        },
        {},
        () => {}
      );
      expect(colors.map((t) => t.key)).toEqual(["--color-a"]);
      expect(fonts.map((t) => t.key)).toEqual(["--font-sans"]);
      expect(others.map((t) => t.key)).toEqual(["--gap"]);
      return null;
    }

    render(<Wrapper />);
  });

  it("addCustomFont handles empty and non-empty newFont", () => { // i18n-exempt: test description
    let add!: () => void; // !
    let setNF!: (v: string) => void; // !
    let getSans!: () => string[];
    let getMono!: () => string[];

    function Wrapper() {
      const hook = useTokenEditor({}, {}, () => {});
      add = hook.addCustomFont;
      setNF = hook.setNewFont;
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
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

    act(() => setNF("Fancy"));
    act(() => add());

    expect(getSans().filter((f) => f === "Fancy")).toHaveLength(1);
    expect(getMono().filter((f) => f === "Fancy")).toHaveLength(1);
  });

  it("setGoogleFont injects link and updates tokens/fonts", () => { // i18n-exempt: test description
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
    expect(document.querySelectorAll('link#google-font-Roboto')).toHaveLength(1);

    act(() => setGoogleFont("mono", "Roboto"));
    expect(document.querySelectorAll('link#google-font-Roboto')).toHaveLength(1);

    act(() => setGoogleFont("sans", "Inter"));

    expect(onChange.mock.calls[2][0]).toMatchObject({
      "--font-sans": '"Inter", var(--font-sans)',
    });
    expect(getSans()).toContain('"Inter", var(--font-sans)');
    expect(getMono()).not.toContain('"Inter", var(--font-sans)');
    expect(document.querySelectorAll('link#google-font-Inter')).toHaveLength(1);
  });
});
