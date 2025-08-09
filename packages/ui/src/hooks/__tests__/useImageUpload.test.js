import { jsx as _jsx } from "react/jsx-runtime";
import { act, render, renderHook } from "@testing-library/react";
import { ImageUploaderWithOrientationCheck } from "@ui";
import { useImageUpload } from "../useImageUpload";
jest.mock("@ui", () => {
    const original = jest.requireActual("@ui");
    return {
        __esModule: true,
        ...original,
        ImageUploaderWithOrientationCheck: jest.fn(({ file }) => (_jsx("div", { "data-testid": "uploader", children: file ? file.name : "none" }))),
    };
});
const mockComponent = ImageUploaderWithOrientationCheck;
describe("useImageUpload", () => {
    afterEach(() => {
        mockComponent.mockClear();
    });
    it("updates file state and renders uploader", () => {
        const { result } = renderHook(() => useImageUpload("landscape"));
        const { getByTestId, rerender } = render(result.current.uploader);
        expect(mockComponent).toHaveBeenCalledWith(expect.objectContaining({ file: null, requiredOrientation: "landscape" }), undefined);
        expect(getByTestId("uploader").textContent).toBe("none");
        const file = new File(["a"], "test.png", { type: "image/png" });
        act(() => {
            result.current.setFile(file);
        });
        rerender(result.current.uploader);
        expect(result.current.file).toBe(file);
        expect(mockComponent).toHaveBeenLastCalledWith(expect.objectContaining({ file, requiredOrientation: "landscape" }), undefined);
        expect(getByTestId("uploader").textContent).toBe("test.png");
    });
});
