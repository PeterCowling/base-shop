jest.mock("@ui/hooks/useMediaUpload", () => ({ useMediaUpload: jest.fn() }));
jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Input: React.forwardRef((props, ref) => <input ref={ref} {...props} />),
    Button: React.forwardRef((props, ref) => <button ref={ref} {...props} />),
  };
});
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import UploadPanel from "../src/components/cms/media/UploadPanel";

const mockHook = useMediaUpload as jest.MockedFunction<typeof useMediaUpload>;

beforeEach(() => {
  mockHook.mockReset();
});

it("calls handleUpload", () => {
  const handleUpload = jest.fn();
  mockHook.mockReturnValue({
    pendingFile: { type: "image/png" } as any,
    thumbnail: null,
    altText: "",
    setAltText: jest.fn(),
    tags: "",
    setTags: jest.fn(),
    actual: "landscape",
    isValid: true,
    progress: null,
    error: undefined,
    inputRef: { current: null },
    openFileDialog: jest.fn(),
    onDrop: jest.fn(),
    onFileChange: jest.fn(),
    handleUpload,
  });
  render(<UploadPanel shop="s" onUploaded={() => {}} />);
  fireEvent.click(screen.getByText("Upload"));
  expect(handleUpload).toHaveBeenCalled();
});

it("disables the upload button while progress is reported", () => {
  mockHook.mockReturnValue({
    pendingFile: { type: "image/png" } as any,
    thumbnail: null,
    altText: "",
    setAltText: jest.fn(),
    tags: "",
    setTags: jest.fn(),
    actual: "landscape",
    isValid: true,
    progress: { done: 0, total: 1 },
    error: undefined,
    inputRef: { current: null },
    openFileDialog: jest.fn(),
    onDrop: jest.fn(),
    onFileChange: jest.fn(),
    handleUpload: jest.fn(),
  });

  render(<UploadPanel shop="s" onUploaded={() => {}} />);

  const button = screen.getByRole("button", { name: /uploading/i });
  expect(button).toBeDisabled();
});

it("forwards upload errors via the onUploadError callback", async () => {
  const onUploadError = jest.fn();
  mockHook.mockReturnValue({
    pendingFile: { type: "image/png" } as any,
    thumbnail: null,
    altText: "",
    setAltText: jest.fn(),
    tags: "",
    setTags: jest.fn(),
    actual: "landscape",
    isValid: true,
    progress: null,
    error: "Upload failed",
    inputRef: { current: null },
    openFileDialog: jest.fn(),
    onDrop: jest.fn(),
    onFileChange: jest.fn(),
    handleUpload: jest.fn(),
  });

  render(<UploadPanel shop="s" onUploaded={() => {}} onUploadError={onUploadError} />);

  await waitFor(() => expect(onUploadError).toHaveBeenCalledWith("Upload failed"));
});
