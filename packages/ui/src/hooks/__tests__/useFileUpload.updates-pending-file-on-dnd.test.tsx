// i18n-exempt: test file uses literal strings for clarity
import type { DragEvent as ReactDragEvent } from "react";
import React from "react";
import { act, renderHook } from "@testing-library/react";

import type { ImageOrientation } from "@acme/types";

import { useFileUpload } from "../useFileUpload";
import { useImageOrientationValidation } from "../useImageOrientationValidation.ts";

jest.mock("@acme/ui/components/atoms/shadcn", () => {
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

const mockOrientation =
  useImageOrientationValidation as jest.MockedFunction<
    typeof useImageOrientationValidation
  >;

beforeEach(() => {
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
});

afterEach(() => {
  jest.clearAllMocks();
});

it("updates pending file on drag-and-drop", () => {
  const file = new File(["d"], "d.png", { type: "image/png" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" as ImageOrientation })
  );

  mockOrientation.mockClear();

  act(() => {
    const evt = {
      preventDefault: jest.fn(),
      dataTransfer: { files: [file] },
    } as unknown as ReactDragEvent<HTMLDivElement>;
    result.current.onDrop(evt);
  });

  expect(result.current.pendingFile).toBe(file);
  expect(result.current.altText).toBe("");
  expect(result.current.tags).toBe("");
  expect(mockOrientation).toHaveBeenCalledWith(file, "landscape");
});
