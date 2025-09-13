import { renderHook, waitFor } from "@testing-library/react";
import { useImageOrientationValidation } from "../useImageOrientationValidation";

class MockImage {
  width = 0;
  height = 0;
  onload: () => void = () => {};
  onerror: () => void = () => {};
  set src(value: string) {
    if (value === "error-url") {
      this.onerror();
      return;
    }
    if (value === "landscape-url") {
      this.width = 200;
      this.height = 100;
    } else {
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
    (global as any).Image = MockImage;
    global.URL.createObjectURL = jest.fn((file: File) => {
      return file.name.includes("landscape")
        ? "landscape-url"
        : file.name.includes("error")
          ? "error-url"
          : "portrait-url";
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
    const { result } = renderHook(() =>
      useImageOrientationValidation(file, "landscape")
    );
    await waitFor(() => expect(result.current.isValid).toBe(true));
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("landscape-url");
  });

  it("returns false when image orientation mismatches", async () => {
    const file = new File(["a"], "portrait.png", { type: "image/png" });
    const { result } = renderHook(() =>
      useImageOrientationValidation(file, "landscape")
    );
    await waitFor(() => expect(result.current.isValid).toBe(false));
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("portrait-url");
  });

  it("returns null values when image fails to load", async () => {
    const file = new File(["a"], "error.png", { type: "image/png" });
    const { result } = renderHook(() =>
      useImageOrientationValidation(file, "landscape")
    );
    await waitFor(() =>
      expect(result.current).toEqual({ actual: null, isValid: null })
    );
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("error-url");
  });

  it("resets actual when image load errors after success", async () => {
    const good = new File(["a"], "landscape.png", { type: "image/png" });
    const bad = new File(["a"], "error.png", { type: "image/png" });
    const { result, rerender } = renderHook(
      ({ f }) => useImageOrientationValidation(f, "landscape"),
      { initialProps: { f: good } }
    );

    await waitFor(() => expect(result.current.actual).toBe("landscape"));
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("landscape-url");

    rerender({ f: bad });

    await waitFor(() =>
      expect(result.current).toEqual({ actual: null, isValid: null })
    );
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("error-url");
  });

  it("resets state when file becomes null", async () => {
    const file = new File(["a"], "landscape.png", { type: "image/png" });
    const { result, rerender } = renderHook(
      ({ f }) => useImageOrientationValidation(f, "landscape"),
      { initialProps: { f: file } }
    );

    await waitFor(() => expect(result.current.actual).toBe("landscape"));

    rerender({ f: null });

    await waitFor(() => expect(result.current.actual).toBeNull());
    expect(result.current.isValid).toBeNull();
  });
});
