jest.mock("@ui/hooks/useMediaUpload", () => ({ useMediaUpload: jest.fn() }));
jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Input: React.forwardRef((props, ref) => <input ref={ref} {...props} />),
  };
});
import { useMediaUpload } from "@ui/hooks/useMediaUpload";
import { render, fireEvent, screen } from "@testing-library/react";
import UploadPanel from "../src/components/cms/media/UploadPanel";

const mockHook = useMediaUpload as jest.MockedFunction<typeof useMediaUpload>;

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
    error: null,
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
