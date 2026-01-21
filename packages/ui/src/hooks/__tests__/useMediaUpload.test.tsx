// packages/ui/src/hooks/__tests__/useMediaUpload.test.tsx
import { renderHook } from "@testing-library/react";

import useMediaUpload, { type UseMediaUploadOptions } from "../useMediaUpload";

jest.mock("../useFileUpload", () => ({
  useFileUpload: () => ({
    pendingFile: new File([""], "a.png", { type: "image/png" }),
  }),
}));

describe("useMediaUpload (image thumbnail path)", () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  beforeEach(() => {
    // stub object URL APIs
    URL.createObjectURL = jest.fn(() => "blob:thumb");
    URL.revokeObjectURL = jest.fn();
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
