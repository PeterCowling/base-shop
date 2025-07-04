import { renderHook, waitFor } from "@testing-library/react";
import { useImageOrientationValidation } from "../useImageOrientationValidation";
class MockImage {
    width = 0;
    height = 0;
    onload = () => { };
    onerror = () => { };
    set src(value) {
        if (value === "landscape-url") {
            this.width = 200;
            this.height = 100;
        }
        else {
            this.width = 100;
            this.height = 200;
        }
        this.onload();
    }
}
describe("useImageOrientationValidation", () => {
    const originalImage = global.Image;
    const originalCreate = global.URL.createObjectURL;
    const originalRevoke = global.URL.revokeObjectURL;
    beforeEach(() => {
        global.Image = MockImage;
        global.URL.createObjectURL = jest.fn((file) => {
            return file.name.includes("landscape") ? "landscape-url" : "portrait-url";
        });
        global.URL.revokeObjectURL = jest.fn();
    });
    afterEach(() => {
        global.Image = originalImage;
        global.URL.createObjectURL = originalCreate;
        global.URL.revokeObjectURL = originalRevoke;
        jest.resetAllMocks();
    });
    it("returns true when image matches orientation", async () => {
        const file = new File(["a"], "landscape.png", { type: "image/png" });
        const { result } = renderHook(() => useImageOrientationValidation(file, "landscape"));
        await waitFor(() => expect(result.current.isValid).toBe(true));
    });
    it("returns false when image orientation mismatches", async () => {
        const file = new File(["a"], "portrait.png", { type: "image/png" });
        const { result } = renderHook(() => useImageOrientationValidation(file, "landscape"));
        await waitFor(() => expect(result.current.isValid).toBe(false));
    });
});
