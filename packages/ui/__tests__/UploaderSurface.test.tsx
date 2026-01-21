import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import { UploaderSurface } from "../src/components/upload/UploaderSurface";

describe("UploaderSurface interactions", () => {
  it("fires openFileDialog on Enter/Space and shows pending/progress/error", () => {
    const openFileDialog = jest.fn();
    const baseProps = {
      inputRef: { current: null } as any,
      pendingFile: null,
      progress: null,
      error: undefined,
      isValid: null,
      isVideo: false,
      requiredOrientation: "landscape" as any,
      onDrop: jest.fn(),
      onFileChange: jest.fn(),
      openFileDialog,
    };
    const { rerender } = render(<UploaderSurface {...baseProps} />);
    const div = screen.getByRole("button", {
      name: /Drop image or video here/i,
    });
    fireEvent.keyDown(div, { key: "Enter" });
    fireEvent.keyDown(div, { key: " " });
    expect(openFileDialog).toHaveBeenCalledTimes(2);

    rerender(
      <UploaderSurface
        {...baseProps}
        pendingFile={{ name: "a.png" } as any}
      />
    );
    expect(screen.getByText(/a\.png/)).toBeInTheDocument();

    rerender(
      <UploaderSurface
        {...baseProps}
        progress={{ done: 5, total: 10 }}
      />
    );
    expect(screen.getByText(/5\/10/)).toBeInTheDocument();

    rerender(<UploaderSurface {...baseProps} error="Nope" />);
    expect(screen.getByText("Nope")).toBeInTheDocument();
  });
});
