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
      const { setToken } = useTokenEditor({ "--color-a": "red" }, onChange);
      return (
        <button onClick={() => setToken("--color-a", "blue")}>update</button>
      );
    }

    render(<Test />);
    fireEvent.click(screen.getByText("update"));
    expect(onChange).toHaveBeenCalledWith({ "--color-a": "blue" });
  });

  it("font upload adds styles and updates font lists", async () => {
    let upload!: ReturnType<typeof useTokenEditor>["handleUpload"]; // !
    let latest: TokenMap = {};

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({});
      latest = tokens;
      const handleChange = (t: TokenMap) =>
        setTokens((prev) => ({ ...prev, ...t }));
      const hook = useTokenEditor(tokens, handleChange);
      upload = hook.handleUpload; // assigned synchronously
      return <span data-testid="mono">{hook.monoFonts.join(",")}</span>;
    }

    render(<Wrapper />);
    const file = new File(["a"], "Custom.woff", { type: "font/woff" });

    await act(async () => {
      upload("mono", { target: { files: [file], value: "" } } as any);
    });

    await waitFor(() =>
      expect(document.getElementById("font-Custom")).not.toBeNull()
    );
    expect(latest["--font-src-Custom"]).toBe("data:font/mock");
    expect(latest["--font-mono"]).toBe('"Custom"');
    expect(screen.getByTestId("mono").textContent).toContain('"Custom"');
  });

  it("addCustomFont appends unique entries", () => {
    let add!: () => void; // !
    let setNF!: (v: string) => void; // !
    let getSans!: () => string[]; // !
    let getMono!: () => string[]; // !

    function Wrapper() {
      const hook = useTokenEditor({}, () => {});
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
