jest.mock("@ui/hooks/useMediaUpload", () => ({ useMediaUpload: jest.fn() }));
jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Input: React.forwardRef((props, ref) => <input ref={ref} {...props} />),
  };
});
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import UploadPanel from "../src/components/cms/media/UploadPanel";

const mockHook = useMediaUpload as jest.MockedFunction<typeof useMediaUpload>;

const createHookValue = () => ({
  pendingFile: { type: "image/png" } as any,
  thumbnail: null,
  altText: "",
  setAltText: jest.fn(),
  tags: "",
  setTags: jest.fn(),
  actual: "landscape" as const,
  isValid: true as boolean | null,
  progress: null as any,
  error: undefined as string | undefined,
  inputRef: { current: null },
  openFileDialog: jest.fn(),
  onDrop: jest.fn(),
  onFileChange: jest.fn(),
  handleUpload: jest.fn(),
});

beforeEach(() => {
  mockHook.mockReturnValue(createHookValue());
});

it("calls handleUpload", () => {
  const handleUpload = jest.fn();
  mockHook.mockReturnValue({ ...createHookValue(), handleUpload });
  render(<UploadPanel shop="s" onUploaded={() => {}} />);
  fireEvent.click(screen.getByText("Upload"));
  expect(handleUpload).toHaveBeenCalled();
});

it("disables the upload button when a request is in flight", () => {
  mockHook.mockReturnValue({
    ...createHookValue(),
    progress: { done: 0, total: 1 },
  });
  render(<UploadPanel shop="s" onUploaded={() => {}} />);
  const button = screen.getByRole("button", { name: /uploading/i });
  expect(button).toBeDisabled();
  expect(screen.getByText("Uploading…")).toBeInTheDocument();
});

it("notifies via onUploadError when the hook reports an error", async () => {
  mockHook.mockReturnValue({
    ...createHookValue(),
    error: "Something went wrong",
  });
  const onUploadError = jest.fn();
  render(
    <UploadPanel
      shop="s"
      onUploaded={() => {}}
      onUploadError={onUploadError}
    />
  );
  await waitFor(() => {
    expect(onUploadError).toHaveBeenCalledWith("Something went wrong");
  });
});
