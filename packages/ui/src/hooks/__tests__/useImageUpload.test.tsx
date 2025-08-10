import { act, render, renderHook } from "@testing-library/react";
import { ImageUploaderWithOrientationCheck } from "@ui";
import { useImageUpload } from "../useImageUpload";

jest.mock("@ui", () => ({
  ...(jest.requireActual("@ui") as any),
  ImageUploaderWithOrientationCheck: jest.fn(
    ({ file }: { file: File | null }) => (
      <div data-testid="uploader">{file ? file.name : "none"}</div>
    ),
  ),
}));

const mockComponent = ImageUploaderWithOrientationCheck as jest.MockedFunction<
  typeof ImageUploaderWithOrientationCheck
>;

describe("useImageUpload", () => {
  afterEach(() => {
    mockComponent.mockClear();
  });

  it("updates file state and renders uploader", () => {
    const { result } = renderHook(() => useImageUpload("landscape"));

    const { getByTestId, rerender } = render(result.current.uploader);
    expect(mockComponent).toHaveBeenCalledWith(
      expect.objectContaining({ file: null, requiredOrientation: "landscape" }),
      undefined
    );
    expect(getByTestId("uploader").textContent).toBe("none");

    const file = new File(["a"], "test.png", { type: "image/png" });
    act(() => {
      result.current.setFile(file);
    });

    rerender(result.current.uploader);

    expect(result.current.file).toBe(file);
    expect(mockComponent).toHaveBeenLastCalledWith(
      expect.objectContaining({ file, requiredOrientation: "landscape" }),
      undefined
    );
    expect(getByTestId("uploader").textContent).toBe("test.png");
  });
});
