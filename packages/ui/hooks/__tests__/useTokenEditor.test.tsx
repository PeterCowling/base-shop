import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { act, useState } from "react";
import { useTokenEditor, type TokenMap } from "../useTokenEditor.ts";

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  readAsDataURL(_file: File) {
    this.result = "data:font/mock";
    if (this.onload) this.onload();
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
      return React.createElement(
        "button",
        { onClick: () => setToken("--color-a", "blue") },
        "update"
      );
    }

    render(React.createElement(Test));
    fireEvent.click(screen.getByText("update"));
    expect(onChange).toHaveBeenCalledWith({ "--color-a": "blue" });
  });

  it("font upload adds styles and updates font lists", async () => {
    let upload: ReturnType<typeof useTokenEditor>["handleUpload"];
    let latest: TokenMap = {} as TokenMap;

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({});
      latest = tokens;
      const handleChange = (t: TokenMap) =>
        setTokens((prev) => ({ ...prev, ...t }));
      const hook = useTokenEditor(tokens, handleChange);
      upload = hook.handleUpload;
      return React.createElement(
        "span",
        { "data-testid": "mono" },
        hook.monoFonts.join(",")
      );
    }

    render(React.createElement(Wrapper));
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
    let add: () => void;
    let setNF: (v: string) => void;
    let getSans: () => string[];
    let getMono: () => string[];

    function Wrapper() {
      const hook = useTokenEditor({}, () => {});
      add = hook.addCustomFont;
      setNF = hook.setNewFont;
      getSans = () => hook.sansFonts;
      getMono = () => hook.monoFonts;
      return null;
    }

    render(React.createElement(Wrapper));

    act(() => {
      setNF("Fancy");
    });
    act(() => {
      add();
    });

    expect(getSans()).toContain("Fancy");
    expect(getMono()).toContain("Fancy");

    act(() => {
      setNF("Fancy");
    });
    act(() => {
      add();
    });

    expect(getSans().filter((f) => f === "Fancy")).toHaveLength(1);
    expect(getMono().filter((f) => f === "Fancy")).toHaveLength(1);
  });
});
