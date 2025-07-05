import { jsx as _jsx } from "react/jsx-runtime";
// packages/ui/hooks/__tests__/useTokenEditor.test.tsx
import { beforeEach, describe, expect, it } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, } from "@testing-library/react";
import { useState } from "react";
import { useTokenEditor } from "../useTokenEditor";
class MockFileReader {
    result = null;
    onload = null;
    readAsDataURL(_) {
        this.result = "data:font/mock";
        this.onload?.();
    }
}
describe("useTokenEditor", () => {
    beforeEach(() => {
        global.FileReader = MockFileReader;
    });
    it("setToken updates the token map", () => {
        const onChange = jest.fn();
        function Test() {
            const { setToken } = useTokenEditor({ "--color-a": "red" }, onChange);
            return (_jsx("button", { onClick: () => setToken("--color-a", "blue"), children: "update" }));
        }
        render(_jsx(Test, {}));
        fireEvent.click(screen.getByText("update"));
        expect(onChange).toHaveBeenCalledWith({ "--color-a": "blue" });
    });
    it("font upload adds styles and updates font lists", async () => {
        let upload; // !
        let latest = {};
        function Wrapper() {
            const [tokens, setTokens] = useState({});
            latest = tokens;
            const handleChange = (t) => setTokens((prev) => ({ ...prev, ...t }));
            const hook = useTokenEditor(tokens, handleChange);
            upload = hook.handleUpload; // assigned synchronously
            return _jsx("span", { "data-testid": "mono", children: hook.monoFonts.join(",") });
        }
        render(_jsx(Wrapper, {}));
        const file = new File(["a"], "Custom.woff", { type: "font/woff" });
        await act(async () => {
            upload("mono", { target: { files: [file], value: "" } });
        });
        await waitFor(() => expect(document.getElementById("font-Custom")).not.toBeNull());
        expect(latest["--font-src-Custom"]).toBe("data:font/mock");
        expect(latest["--font-mono"]).toBe('"Custom"');
        expect(screen.getByTestId("mono").textContent).toContain('"Custom"');
    });
    it("addCustomFont appends unique entries", () => {
        let add; // !
        let setNF; // !
        let getSans; // !
        let getMono; // !
        function Wrapper() {
            const hook = useTokenEditor({}, () => { });
            add = hook.addCustomFont;
            setNF = hook.setNewFont;
            getSans = () => hook.sansFonts;
            getMono = () => hook.monoFonts;
            return null;
        }
        render(_jsx(Wrapper, {}));
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
