import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import UploadPanel from "../UploadPanel";
import { useMediaUpload } from "@acme/ui/hooks/useMediaUpload";

jest.mock("@acme/ui/hooks/useMediaUpload", () => ({ useMediaUpload: jest.fn() }));
jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  const Input = React.forwardRef(function InputMock(
    props: any,
    ref: any
  ) {
    return <input ref={ref} {...props} />;
  });
  // Ensure lint rule detects explicit displayName
  (Input as any).displayName = "InputMock";

  const Button = React.forwardRef(function ButtonMock(
    props: any,
    ref: any
  ) {
    return <button ref={ref} {...props} />;
  });
  (Button as any).displayName = "ButtonMock";

  return { Input, Button };
});

const mockHook = useMediaUpload as jest.MockedFunction<typeof useMediaUpload>;

beforeEach(() => {
  mockHook.mockReset();
});

function setupMock(overrides: Partial<ReturnType<typeof useMediaUpload>> = {}) {
  const defaults = {
    pendingFile: { type: "image/png" } as any,
    thumbnail: null as string | null,
    altText: "",
    setAltText: jest.fn(),
    tags: "",
    setTags: jest.fn(),
    actual: "landscape" as const,
    isValid: true as boolean | null,
    progress: null,
    error: undefined as string | undefined,
    inputRef: { current: null },
    openFileDialog: jest.fn(),
    onDrop: jest.fn(),
    onFileChange: jest.fn(),
    handleUpload: jest.fn(),
  };
  mockHook.mockReturnValue({ ...defaults, ...overrides });
  return { ...defaults, ...overrides };
}

describe("UploadPanel", () => {
  it("handles drag enter/leave and drop", () => {
    const { onDrop } = setupMock();
    render(<UploadPanel shop="shop" onUploaded={jest.fn()} />);
    const dropzone = screen.getByRole("button", {
      name: /drop image or video here or press enter to browse/i,
    });
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass("ring-2");
    expect(dropzone).toHaveClass("bg-primary/5");
    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass("ring-2");
    fireEvent.dragEnter(dropzone);
    const file = new File(["x"], "x.png", { type: "image/png" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onDrop).toHaveBeenCalled();
    expect(dropzone).not.toHaveClass("ring-2");
  });

  it("opens file dialog with keyboard", () => {
    const { openFileDialog } = setupMock();
    render(<UploadPanel shop="shop" onUploaded={jest.fn()} />);
    const dropzone = screen.getByRole("button", {
      name: /drop image or video here or press enter to browse/i,
    });
    fireEvent.keyDown(dropzone, { key: "Enter" });
    expect(openFileDialog).toHaveBeenCalled();
  });

  it("shows invalid orientation message and feedback", () => {
    setupMock({
      actual: "portrait",
      isValid: false,
      progress: { done: 1, total: 2 },
      error: "oops",
    });
    render(<UploadPanel shop="shop" onUploaded={jest.fn()} />);
    expect(
      screen.getByText(
        "Selected image is portrait; please upload a landscape image."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Uploaded 1/2")).toBeInTheDocument();
    expect(screen.getByText("oops")).toBeInTheDocument();
  });

  it("accepts alt and tag input and uploads when valid", () => {
    const { setAltText, setTags, handleUpload } = setupMock({
      actual: "landscape",
      isValid: true,
    });
    render(<UploadPanel shop="shop" onUploaded={jest.fn()} />);
    expect(
      screen.getByText("Image orientation is landscape; requirement satisfied.")
    ).toBeInTheDocument();
    const alt = screen.getByPlaceholderText("Alt text");
    fireEvent.change(alt, { target: { value: "desc" } });
    expect(setAltText).toHaveBeenCalledWith("desc");
    const tags = screen.getByPlaceholderText("Tags (comma separated)");
    fireEvent.change(tags, { target: { value: "t1,t2" } });
    expect(setTags).toHaveBeenCalledWith("t1,t2");
    fireEvent.click(screen.getByText("Upload"));
    expect(handleUpload).toHaveBeenCalled();
  });

  it("disables the upload button while a file is uploading", () => {
    setupMock({
      progress: { done: 0, total: 1 },
    });

    render(<UploadPanel shop="shop" onUploaded={jest.fn()} />);

    const uploadButton = screen.getByRole("button", { name: /uploading/i });
    expect(uploadButton).toBeDisabled();
  });

  it("invokes onUploadError when the upload hook reports an error", async () => {
    setupMock({ error: "Upload failed" });
    const onUploadError = jest.fn();

    render(
      <UploadPanel
        shop="shop"
        onUploaded={jest.fn()}
        onUploadError={onUploadError}
      />
    );

    await waitFor(() => expect(onUploadError).toHaveBeenCalledWith("Upload failed"));
  });
});
