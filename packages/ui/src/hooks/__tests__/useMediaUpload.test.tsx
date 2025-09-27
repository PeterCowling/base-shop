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
    // @ts-expect-error: test stubs object URL API
    URL.createObjectURL = jest.fn(() => "blob:thumb");
    // @ts-expect-error: test stubs object URL API
    URL.revokeObjectURL = jest.fn();
  });
  afterEach(() => {
    // @ts-expect-error: restore stubbed API
    URL.createObjectURL = originalCreate;
    // @ts-expect-error: restore stubbed API
    URL.revokeObjectURL = originalRevoke;
  });

  test("sets thumbnail when pendingFile is an image", () => {
    const opts = { shop: "s", requiredOrientation: "landscape" } as UseMediaUploadOptions;
    const { result } = renderHook(() => useMediaUpload(opts));
    expect(result.current.thumbnail).toBe("blob:thumb");
  });
});
