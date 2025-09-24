// packages/ui/src/hooks/__tests__/useMediaUpload.test.tsx
import { renderHook } from "@testing-library/react";
jest.mock("../useFileUpload", () => ({
  useFileUpload: () => ({
    pendingFile: new File([1], "a.png", { type: "image/png" }),
  }),
}));
import useMediaUpload from "../useMediaUpload";

describe("useMediaUpload (image thumbnail path)", () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  beforeEach(() => {
    // stub object URL APIs
    // @ts-ignore
    URL.createObjectURL = jest.fn(() => "blob:thumb");
    // @ts-ignore
    URL.revokeObjectURL = jest.fn();
  });
  afterEach(() => {
    // @ts-ignore
    URL.createObjectURL = originalCreate;
    // @ts-ignore
    URL.revokeObjectURL = originalRevoke;
  });

  test("sets thumbnail when pendingFile is an image", () => {
    const { result } = renderHook(() => useMediaUpload({ shop: "s", requiredOrientation: "landscape" } as any));
    expect(result.current.thumbnail).toBe("blob:thumb");
  });
});
