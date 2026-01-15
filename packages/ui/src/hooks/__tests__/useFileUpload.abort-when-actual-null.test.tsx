import { act, renderHook } from "@testing-library/react";
import React, { forwardRef } from "react";
import type { ButtonHTMLAttributes, ForwardedRef, ChangeEvent } from "react";

function createShadcnStub() {
  const Button = forwardRef(function Button(
    props: ButtonHTMLAttributes<HTMLButtonElement>,
    ref: ForwardedRef<HTMLButtonElement>
  ) {
    return <button ref={ref} {...props} />;
  });
  (Button as any).displayName = "Button";
  return { Button };
}

jest.mock("@ui/components/atoms/shadcn", createShadcnStub);

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(),
}));

import { useImageOrientationValidation } from "../useImageOrientationValidation";
import { useFileUpload } from "../useFileUpload";

const mockOrientation =
  useImageOrientationValidation as jest.MockedFunction<
    typeof useImageOrientationValidation
  >;

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  (global as any).fetch = mockFetch;
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
});

afterEach(() => {
  (global as any).fetch = originalFetch as any;
  jest.clearAllMocks();
});

// i18n-exempt: test name
it("aborts upload and reports orientation mismatch when actual is null", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  mockOrientation.mockReturnValue({ actual: null, isValid: false });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange(
      { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>
    );
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(mockFetch).not.toHaveBeenCalled();
  // i18n-exempt: assertion message mirrors UI copy
  expect(result.current.error).toBe(
    "Image orientation mismatch: expected landscape"
  );
});
