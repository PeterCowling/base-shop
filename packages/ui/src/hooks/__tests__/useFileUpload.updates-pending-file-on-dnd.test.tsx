// i18n-exempt: test file uses literal strings for clarity
import { act, renderHook } from "@testing-library/react";
import React from "react";
import type { DragEvent as ReactDragEvent } from "react";
import type { ImageOrientation } from "@acme/types";

jest.mock("@ui/components/atoms/shadcn", () => {
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
