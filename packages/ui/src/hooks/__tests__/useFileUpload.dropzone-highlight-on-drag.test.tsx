import { act, fireEvent, render } from "@testing-library/react";
import React, { forwardRef } from "react";
import type { ButtonHTMLAttributes, ForwardedRef } from "react";

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
  useImageOrientationValidation: jest.fn(() => ({ actual: "landscape", isValid: true })),
}));

import { useFileUpload } from "../useFileUpload";

// i18n-exempt: test name
it("highlights dropzone on drag enter and removes highlight on drag leave", () => {
  const Wrapper = () =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" }).uploader;

  const { getByLabelText } = render(<Wrapper />);
  // i18n-exempt: label text under test
  const dropzone = getByLabelText(
    "Drop image or video here or press Enter to browse"
  );

  act(() => {
    fireEvent.dragOver(dropzone);
    fireEvent.dragEnter(dropzone);
  });
  expect(dropzone).toHaveClass("ring-2");
  expect(dropzone).toHaveClass("bg-primary/5");

  act(() => {
    fireEvent.dragLeave(dropzone);
  });
  expect(dropzone).not.toHaveClass("ring-2");
});
