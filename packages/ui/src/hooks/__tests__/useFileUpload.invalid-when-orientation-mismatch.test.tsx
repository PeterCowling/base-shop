import * as React from "react";
import { act, renderHook } from "@testing-library/react";

import { useFileUpload } from "../useFileUpload.tsx";
import { useImageOrientationValidation } from "../useImageOrientationValidation.ts";

function createShadcnStub() {
  const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
    (props, ref) => <button ref={ref} {...props} />
  );
  Button.displayName = "Button";
  return { Button };
}

jest.mock("@acme/design-system/shadcn", createShadcnStub);

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

it("marks file invalid when orientation mismatches", () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  mockOrientation.mockReturnValue({ actual: "portrait", isValid: false });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    const evt = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    result.current.onFileChange(evt);
  });

  expect(mockOrientation).toHaveBeenCalledWith(file, "landscape");
  expect(result.current.isValid).toBe(false);
  expect(result.current.actual).toBe("portrait");
});
