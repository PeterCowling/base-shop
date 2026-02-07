// i18n-exempt: test file uses literal strings for clarity
import type { ChangeEvent } from "react";
import React from "react";
import { act, renderHook } from "@testing-library/react";

import type { ImageOrientation } from "@acme/types";

import { useFileUpload } from "../useFileUpload";

jest.mock("@acme/design-system/shadcn", () => {
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

it("sets error when response is not ok", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: "bad" }),
    statusText: "bad",
  } as unknown as Response);
  const file = new File(["x"], "x.png", { type: "image/png" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" as ImageOrientation })
  );

  act(() => {
    const evt = { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
    result.current.onFileChange(evt);
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(result.current.error).toBe("bad"); // i18n-exempt: asserting error value
});
