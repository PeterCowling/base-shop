// i18n-exempt: test file uses literal strings for clarity
import { act, render, renderHook } from "@testing-library/react";
import React from "react";
import type { ChangeEvent } from "react";
import type { ImageOrientation } from "@acme/types";

jest.mock("@/components/atoms/shadcn", () => {
  type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <button ref={ref} {...props} />
  ));
  Button.displayName = "Button";
  return { Button };
});

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(),
}));

import { useImageOrientationValidation } from "../useImageOrientationValidation.ts";
import { useFileUpload } from "../useFileUpload";

const mockOrientation =
  useImageOrientationValidation as jest.MockedFunction<
    typeof useImageOrientationValidation
  >;

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
});

afterEach(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  jest.clearAllMocks();
});

it("renders error message when upload fetch rejects", async () => {
  mockFetch.mockRejectedValueOnce(new Error("fail"));
  const file = new File(["x"], "x.png", { type: "image/png" });

  const { result, rerender: rerenderHook } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" as ImageOrientation })
  );
  const { getByText, rerender } = render(result.current.uploader);

  act(() => {
    const evt = { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
    result.current.onFileChange(evt);
  });
  rerenderHook();
  rerender(result.current.uploader);

  await act(async () => {
    await result.current.handleUpload();
  });
  rerenderHook();
  rerender(result.current.uploader);

  expect(getByText("fail")).toBeInTheDocument(); // i18n-exempt: asserting error display
});
