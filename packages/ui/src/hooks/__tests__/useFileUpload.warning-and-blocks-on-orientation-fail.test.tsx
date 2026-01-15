import { act, render, renderHook } from "@testing-library/react";
import React from "react";
import type { ComponentProps, ForwardedRef, ChangeEvent } from "react";

function createShadcnStub() {
  const Button = React.forwardRef<HTMLButtonElement, ComponentProps<"button">>(
    (props, ref: ForwardedRef<HTMLButtonElement>) => <button ref={ref} {...props} />
  );
  Button.displayName = "Button";
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
  (global as any).fetch = originalFetch;
  jest.clearAllMocks();
});

it("shows warning and blocks upload when orientation validation fails", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  mockOrientation.mockReturnValue({ actual: "portrait", isValid: false });

  const { result, rerender: rerenderHook } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );
  const { getByText, rerender } = render(result.current.uploader);

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>);
  });
  rerenderHook();
  rerender(result.current.uploader);

  expect(
    getByText("Wrong orientation (needs landscape)")
  ).toBeInTheDocument();

  await act(async () => {
    await result.current.handleUpload();
  });
  rerenderHook();
  rerender(result.current.uploader);

  expect(mockFetch).not.toHaveBeenCalled();
  expect(
    getByText(
      "Image orientation mismatch: expected landscape, got portrait",
    ),
  ).toBeInTheDocument();
});
