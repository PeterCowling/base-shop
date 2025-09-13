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

  it("classifies tokens into colors, fonts, and others", () => {
    function Test() {
      const { colors, fonts, others } = useTokenEditor(
        {
          "--color-a": "red",
          "--font-sans": "Arial",
          "--gap": "1rem",
        },
        {},
        () => {}
      );
      expect(colors.map((t) => t.key)).toEqual(["--color-a"]);
      expect(fonts.map((t) => t.key)).toEqual(["--font-sans"]);
      expect(others.map((t) => t.key)).toEqual(["--gap"]);
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

  it("handleUpload with no files leaves tokens unchanged", async () => {
    let upload!: ReturnType<typeof useTokenEditor>["handleUpload"]; // !
    let latest: TokenMap = { "--font-sans": "system-ui" };

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({
        "--font-sans": "system-ui",
      });
      latest = tokens;
      const handleChange = (t: TokenMap) =>
        setTokens((prev) => ({ ...prev, ...t }));
      const hook = useTokenEditor(tokens, {}, handleChange);
      upload = hook.handleUpload; // assigned synchronously
      return null;
    }

    render(<Wrapper />);

    await act(async () => {
      upload("sans", { target: { files: [] } } as any);
    });

    expect(latest).toEqual({ "--font-sans": "system-ui" });
  });

  it("loads existing font tokens on mount", async () => {
    let getSans!: () => string[]; // !
    let getMono!: () => string[]; // !

    function Wrapper() {
      const hook = useTokenEditor(
        { "--font-src-Test": "data:font/mock" },
        {},
        () => {}
      );
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
      return null;
    }

    render(<Wrapper />);

    await waitFor(() =>
      expect(document.getElementById("font-Test")).not.toBeNull()
    );

    expect(getSans()).toContain('"Test"');
    expect(getMono()).toContain('"Test"');
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

  it("calling setGoogleFont twice with the same font only inserts one link", () => {
    let setGF!: ReturnType<typeof useTokenEditor>["setGoogleFont"]; // !

    function Wrapper() {
      const hook = useTokenEditor({}, {}, () => {});
      setGF = hook.setGoogleFont;
      return null;
    }

    render(<Wrapper />);

    act(() => setGF("sans", "Inter"));
    act(() => setGF("sans", "Inter"));

    const links = document.head.querySelectorAll(
      "link#google-font-Inter"
    );
    expect(links).toHaveLength(1);
  });

  it("addCustomFont with empty input does nothing", () => {
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

    const initialSans = getSans();
    const initialMono = getMono();

    act(() => setNF(""));
    act(() => add());

    expect(getSans()).toEqual(initialSans);
    expect(getMono()).toEqual(initialMono);
    expect(getSans().filter((f) => f === "")).toHaveLength(0);
    expect(getMono().filter((f) => f === "")).toHaveLength(0);
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
});
