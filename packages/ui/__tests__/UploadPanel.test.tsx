import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useMediaUpload } from "@acme/ui/hooks/useMediaUpload";

import UploadPanel from "../src/components/cms/media/UploadPanel";
import type { UseMediaUploadResult } from "../src/hooks/useMediaUpload";

jest.mock("@acme/ui/hooks/useMediaUpload", () => ({ useMediaUpload: jest.fn() }));
jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  const Input = React.forwardRef((props: any, ref: any) => <input ref={ref} {...props} />);
  Input.displayName = "Input";
  const Button = React.forwardRef((props: any, ref: any) => <button ref={ref} {...props} />);
  Button.displayName = "Button";
  return { Input, Button };
});

const mockHook = useMediaUpload as jest.MockedFunction<typeof useMediaUpload>;

beforeEach(() => {
  mockHook.mockReset();
});

const makeResult = (overrides: Partial<UseMediaUploadResult> = {}): UseMediaUploadResult => ({
  pendingFile: null,
  thumbnail: null,
  altText: "",
  setAltText: jest.fn(),
  tags: "",
  setTags: jest.fn(),
  actual: null,
  isValid: true,
  progress: null,
  error: undefined,
  handleUpload: jest.fn(async () => {}),
  isUploading: false,
  inputRef: { current: null },
  openFileDialog: jest.fn(),
  onDrop: jest.fn(),
  onFileChange: jest.fn(),
  processDataTransfer: jest.fn(async () => "none"),
  uploader: <div />,
  ...overrides,
});

it("calls handleUpload", () => {
  const handleUpload = jest.fn();
  mockHook.mockReturnValue(makeResult({
    pendingFile: { type: "image/png" } as any,
    actual: "landscape",
    isValid: true,
    handleUpload,
  }));
  render(<UploadPanel shop="s" onUploaded={() => {}} />);
  fireEvent.click(screen.getByText("Upload"));
  expect(handleUpload).toHaveBeenCalled();
});

it("disables the upload button while progress is reported", () => {
  mockHook.mockReturnValue(makeResult({
    pendingFile: { type: "image/png" } as any,
    actual: "landscape",
    isValid: true,
    progress: { done: 0, total: 1 },
  }));

  render(<UploadPanel shop="s" onUploaded={() => {}} />);

  const button = screen.getByRole("button", { name: /uploading/i });
  expect(button).toBeDisabled();
});

it("forwards upload errors via the onUploadError callback", async () => {
  const onUploadError = jest.fn();
  mockHook.mockReturnValue(makeResult({
    pendingFile: { type: "image/png" } as any,
    actual: "landscape",
    isValid: true,
    error: "Upload failed",
  }));

  render(<UploadPanel shop="s" onUploaded={() => {}} onUploadError={onUploadError} />);

  await waitFor(() => expect(onUploadError).toHaveBeenCalledWith("Upload failed"));
});
