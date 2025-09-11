// packages/ui/hooks/__tests__/useTokenEditor.test.tsx
import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { useTokenEditor, type TokenMap } from "../useTokenEditor";

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
  });

  it("setToken updates the token map", () => {
    const onChange = jest.fn();

    function Test() {
      const { setToken } = useTokenEditor(
        { "--color-a": "red" },
        { "--color-a": "red" },
        onChange
      );
      return (
        <button onClick={() => setToken("--color-a", "blue")}>update</button>
      );
    }

    render(<Test />);
    fireEvent.click(screen.getByText("update"));
    expect(onChange).toHaveBeenCalledWith({ "--color-a": "blue" });
  });

  it("marks tokens as overridden when differing from base", () => {
    function Test() {
      const { colors } = useTokenEditor(
        { "--color-a": "blue" },
        { "--color-a": "red" },
        () => {}
      );
      expect(colors[0]).toMatchObject({
        key: "--color-a",
        defaultValue: "red",
        isOverridden: true,
        value: "blue",
      });
      return null;
    }

    render(<Test />);
  });

  it("font upload adds styles and updates font lists", async () => {
    let upload!: ReturnType<typeof useTokenEditor>["handleUpload"]; // !
    let latest: TokenMap = {};

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({});
      latest = tokens;
      const handleChange = (t: TokenMap) =>
        setTokens((prev) => ({ ...prev, ...t }));
      const hook = useTokenEditor(tokens, {}, handleChange);
      upload = hook.handleUpload; // assigned synchronously
      return (
        <>
          <span data-cy="mono">{hook.monoFonts.join(",")}</span>
          <span data-cy="sans">{hook.sansFonts.join(",")}</span>
        </>
      );
    }

    render(<Wrapper />);

    const monoFile = new File(["a"], "Custom.woff", { type: "font/woff" });
    await act(async () => {
      upload("mono", { target: { files: [monoFile], value: "" } } as any);
    });
    await waitFor(() =>
      expect(document.getElementById("font-Custom")).not.toBeNull()
    );
    expect(latest["--font-src-Custom"]).toBe("data:font/mock");
    expect(latest["--font-mono"]).toBe('"Custom"');
    expect(screen.getByTestId("mono").textContent).toContain('"Custom"');

    const sansFile = new File(["b"], "Fancy.woff", { type: "font/woff" });
    await act(async () => {
      upload("sans", { target: { files: [sansFile], value: "" } } as any);
    });
    await waitFor(() =>
      expect(document.getElementById("font-Fancy")).not.toBeNull()
    );
    expect(latest["--font-src-Fancy"]).toBe("data:font/mock");
    expect(latest["--font-sans"]).toBe('"Fancy"');
    expect(screen.getByTestId("sans").textContent).toContain('"Fancy"');
  });

  it("handleUpload ignores empty file selections", async () => {
    let upload!: ReturnType<typeof useTokenEditor>["handleUpload"]; // !
    let latest: TokenMap = {};

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({});
      latest = tokens;
      const hook = useTokenEditor(tokens, {}, (t) =>
        setTokens((prev) => ({ ...prev, ...t }))
      );
      upload = hook.handleUpload;
      return null;
    }

    render(<Wrapper />);
    await act(async () => {
      upload("sans", { target: { files: [], value: "" } } as any);
    });
    expect(latest).toEqual({});
  });

  it("initial font-src tokens create style nodes and update lists", async () => {
    function Wrapper() {
      const hook = useTokenEditor(
        { "--font-src-Test": "data:font/mock" },
        {},
        () => {}
      );
      return (
        <>
          <span data-cy="mono">{hook.monoFonts.join(",")}</span>
          <span data-cy="sans">{hook.sansFonts.join(",")}</span>
        </>
      );
    }

    render(<Wrapper />);

    await waitFor(() =>
      expect(document.getElementById("font-Test")).not.toBeNull()
    );
    expect(screen.getByTestId("mono").textContent).toContain('"Test"');
    expect(screen.getByTestId("sans").textContent).toContain('"Test"');
  });

  it("setGoogleFont inserts link once and updates tokens", () => {
    let setGF!: ReturnType<typeof useTokenEditor>["setGoogleFont"]; // !
    let latest: TokenMap = {};

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({});
      latest = tokens;
      const handleChange = (t: TokenMap) =>
        setTokens((prev) => ({ ...prev, ...t }));
      const hook = useTokenEditor(tokens, {}, handleChange);
      setGF = hook.setGoogleFont;
      return null;
    }

    render(<Wrapper />);

    act(() => setGF("sans", "Inter"));
    const link = document.getElementById(
      "google-font-Inter"
    ) as HTMLLinkElement;
    expect(link).not.toBeNull();
    expect(link.href).toBe(
      "https://fonts.googleapis.com/css2?family=Inter&display=swap"
    );
    expect(latest["--font-sans"]).toBe('"Inter", var(--font-sans)');

    act(() => setGF("mono", "Inter"));
    expect(document.querySelectorAll("#google-font-Inter")).toHaveLength(1);
    expect(latest["--font-mono"]).toBe('"Inter", var(--font-mono)');
  });

  it("addCustomFont appends unique entries", () => {
    let add!: () => void; // !
    let setNF!: (v: string) => void; // !
    let getSans!: () => string[]; // !
    let getMono!: () => string[]; // !

    function Wrapper() {
      const hook = useTokenEditor({}, {}, () => {});
      add = hook.addCustomFont;
      setNF = hook.setNewFont;
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
      return null;
    }

    render(<Wrapper />);

    act(() => setNF("Fancy"));
    act(() => add());

    expect(getSans()).toContain("Fancy");
    expect(getMono()).toContain("Fancy");

    /* second attempt should not duplicate */
    act(() => setNF("Fancy"));
    act(() => add());

    expect(getSans().filter((f) => f === "Fancy")).toHaveLength(1);
    expect(getMono().filter((f) => f === "Fancy")).toHaveLength(1);
  });

  it("addCustomFont ignores blank input", () => {
    let add!: () => void; // !
    let setNF!: (v: string) => void; // !
    let getSans!: () => string[]; // !
    let getMono!: () => string[]; // !

    function Wrapper() {
      const hook = useTokenEditor({}, {}, () => {});
      add = hook.addCustomFont;
      setNF = hook.setNewFont;
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
      return null;
    }

    render(<Wrapper />);
    const sansBefore = getSans().length;
    const monoBefore = getMono().length;

    act(() => setNF(""));
    act(() => add());

    expect(getSans()).toHaveLength(sansBefore);
    expect(getMono()).toHaveLength(monoBefore);
    expect(getSans()).not.toContain("");
    expect(getMono()).not.toContain("");
  });
});
