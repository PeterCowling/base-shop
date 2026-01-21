// i18n-exempt: test file uses literal strings for clarity
import React from "react";
import { act, renderHook } from "@testing-library/react";

import type { ImageOrientation } from "@acme/types";

import { useFileUpload } from "../useFileUpload";

jest.mock("@acme/ui/components/atoms/shadcn", () => {
  type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <button ref={ref} {...props} />
  ));
  Button.displayName = "Button";
  return { Button };
});

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(() => ({ actual: "landscape", isValid: true })),
}));

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  jest.clearAllMocks();
});

it("returns early when no file is pending", async () => {
  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" as ImageOrientation })
  );

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(mockFetch).not.toHaveBeenCalled();
});
