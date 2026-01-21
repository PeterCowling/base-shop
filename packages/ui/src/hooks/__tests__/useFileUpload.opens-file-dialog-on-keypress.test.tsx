import * as React from "react";
import { act, fireEvent, render, renderHook } from "@testing-library/react";

import { useFileUpload } from "../useFileUpload.tsx";

function createShadcnStub() {
  const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
    (props, ref) => <button ref={ref} {...props} />
  );
  Button.displayName = "Button";
  return { Button };
}

jest.mock("@acme/ui/components/atoms/shadcn", createShadcnStub);

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(() => ({ actual: "landscape", isValid: true })),
}));

it("opens file dialog when pressing Enter on uploader", () => {
  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  const { getByLabelText, container } = render(result.current.uploader);
  const input = container.querySelector("input") as HTMLInputElement;
  const clickSpy = jest.spyOn(input, "click");

  const dropzone = getByLabelText(
    "Drop image or video here or press Enter to browse" // i18n-exempt: test-only label assertion
  );

  act(() => {
    fireEvent.keyDown(dropzone, { key: "Enter" });
    fireEvent.keyDown(dropzone, { key: " " });
  });

  expect(clickSpy).toHaveBeenCalledTimes(2);
});
