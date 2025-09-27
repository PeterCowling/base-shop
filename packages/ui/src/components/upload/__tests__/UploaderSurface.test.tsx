/* i18n-exempt file -- test titles and UI copy are asserted literally */
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import UploaderSurface from "../UploaderSurface";

function makeProps(
  overrides: Partial<React.ComponentProps<typeof UploaderSurface>> = {},
) {
  const inputRef = {
    current: document.createElement("input"),
  } as React.MutableRefObject<HTMLInputElement | null>;
  return {
    inputRef,
    pendingFile: null,
    progress: null,
    error: undefined,
    isValid: true,
    isVideo: false,
    requiredOrientation: "landscape" as const,
    onDrop: jest.fn(),
    onFileChange: jest.fn(),
    openFileDialog: jest.fn(),
    ...overrides,
  } as React.ComponentProps<typeof UploaderSurface> & {
    inputRef: React.MutableRefObject<HTMLInputElement | null>;
  };
}

describe("UploaderSurface", () => {
  it("renders base UI and triggers file dialog on Enter/Space", () => {
    const props = makeProps();
    const { getByLabelText, getByText } = render(<UploaderSurface {...props} />);
    expect(getByText(/Drag\s*&\s*drop or/i)).toBeInTheDocument();
    const dropzone = getByLabelText(
      "Drop image or video here or press Enter to browse"
    );
    fireEvent.keyDown(dropzone, { key: "Enter" });
    fireEvent.keyDown(dropzone, { key: " " });
    expect(props.openFileDialog).toHaveBeenCalledTimes(2);
  });

  it("applies highlight on drag enter and removes on drop", () => {
    const props = makeProps();
    const { getByLabelText } = render(<UploaderSurface {...props} />);
    const dropzone = getByLabelText(
      "Drop image or video here or press Enter to browse"
    );
    fireEvent.dragOver(dropzone);
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass("ring-2");
    fireEvent.drop(
      dropzone,
      { dataTransfer: { files: [] } } as unknown as DragEvent,
    );
    expect(props.onDrop).toHaveBeenCalled();
    expect(dropzone).not.toHaveClass("ring-2");
  });

  it("shows pending file name, progress, and error", () => {
    const file = new File(["x"], "name.png", { type: "image/png" });
    const { getByText } = render(
      <UploaderSurface {...makeProps({ pendingFile: file })} />
    );
    expect(getByText("name.png")).toBeInTheDocument();

    const { container } = render(
      <UploaderSurface {...makeProps({ progress: { done: 1, total: 3 } })} />
    );
    expect(container.textContent).toMatch(/Uploading…\s*1\/3/);

    const { getByText: getByText2 } = render(
      <UploaderSurface {...makeProps({ error: "boom" })} />
    );
    expect(getByText2("boom")).toBeInTheDocument();
  });

  it("shows orientation warning only for non-video when invalid", () => {
    const r1 = render(
      <UploaderSurface {...makeProps({ isValid: false, isVideo: false, requiredOrientation: "portrait" as any })} />
    );
    expect(r1.getByText("Wrong orientation (needs portrait)")).toBeInTheDocument();
    r1.unmount();

    const r2 = render(
      <UploaderSurface {...makeProps({ isValid: false, isVideo: true, requiredOrientation: "portrait" as any })} />
    );
    expect(r2.queryByText(/Wrong orientation/)).toBeNull();
  });
});
