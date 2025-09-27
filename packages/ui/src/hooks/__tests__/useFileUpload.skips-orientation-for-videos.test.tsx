// i18n-exempt: test file uses literal strings for clarity
import { act, renderHook } from "@testing-library/react";
import React from "react";
import type { ChangeEvent } from "react";

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
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ url: "/v.mp4", altText: "", type: "video" }),
  } as unknown as Response);
  (global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
});

afterEach(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  jest.clearAllMocks();
});

it("skips orientation validation for videos", async () => {
  const file = new File(["v"], "v.mp4", { type: "video/mp4" });
  const onUploaded = jest.fn();

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape", onUploaded })
  );

  await act(async () => {});
  mockOrientation.mockClear();

  act(() => {
    const evt = { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
    result.current.onFileChange(evt);
    result.current.setAltText("alt"); // i18n-exempt
    result.current.setTags("tag"); // i18n-exempt
  });

  expect(mockOrientation).toHaveBeenCalledWith(null, "landscape");
  expect(result.current.isValid).toBe(true);
  expect(result.current.actual).toBeNull();

  await act(async () => {
    await result.current.handleUpload();
  });

  const body = (mockFetch.mock.calls[0][1] as RequestInit).body as FormData;
  expect(body.get("file")).toBe(file);
  expect(onUploaded).toHaveBeenCalled();
  expect(result.current.pendingFile).toBeNull();
  expect(result.current.altText).toBe("");
  expect(result.current.tags).toBe("");
});
