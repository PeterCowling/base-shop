// packages/ui/src/hooks/__tests__/useMediaUpload.test.tsx
import { renderHook } from "@testing-library/react";
jest.mock("../useFileUpload", () => ({
  useFileUpload: () => ({
    pendingFile: new File([1], "a.png", { type: "image/png" }),
  }),
}));
import useMediaUpload, { type UseMediaUploadOptions } from "../useMediaUpload";

describe("useMediaUpload (image thumbnail path)", () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  beforeEach(() => {
    // stub object URL APIs
    URL.createObjectURL = jest.fn(() => "blob:thumb");
  });
  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });
  test("sets thumbnail when pendingFile is an image", () => {
    const opts = { shop: "s", requiredOrientation: "landscape" } as UseMediaUploadOptions;
    const { result } = renderHook(() => useMediaUpload(opts));
    expect(result.current.thumbnail).toBe("blob:thumb");
  });
});
