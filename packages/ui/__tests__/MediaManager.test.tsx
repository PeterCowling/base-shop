import { deleteMedia, uploadMedia } from "@cms/actions/media.server";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import MediaManager from "../components/cms/MediaManager";

jest.mock("@ui/hooks/useImageOrientationValidation");
jest.mock("@cms/actions/media.server");

const mockHook = useImageOrientationValidation as jest.MockedFunction<
  typeof useImageOrientationValidation
>;
const mockDelete = deleteMedia as jest.MockedFunction<typeof deleteMedia>;
const mockUpload = uploadMedia as jest.MockedFunction<typeof uploadMedia>;

beforeEach(() => {
  mockHook.mockReturnValue({ actual: null, isValid: null });
  mockDelete.mockResolvedValue(undefined as any);
  mockUpload.mockResolvedValue({ url: "/new.png", altText: "a" } as any);
});

describe("MediaManager", () => {
  it("deletes file when confirmed", async () => {
    (global as any).confirm = jest.fn(() => true);
    render(
      <MediaManager shop="s" initialFiles={[{ url: "/img.jpg" } as any]} />
    );
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("s", "/img.jpg")
    );
  });

  it("uploads file with alt text", async () => {
    mockHook.mockReturnValue({ actual: "landscape", isValid: true });
    const file = new File(["a"], "a.png", { type: "image/png" });
    render(<MediaManager shop="s" initialFiles={[]} />);
    const drop = screen.getByText("Drop image here or click to upload");
    fireEvent.drop(drop, { dataTransfer: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText("Alt text"), {
      target: { value: "alt" },
    });
    fireEvent.click(screen.getByText("Upload"));
    await waitFor(() => expect(mockUpload).toHaveBeenCalled());
    const fd = mockUpload.mock.calls[0][1] as FormData;
    expect(fd.get("altText")).toBe("alt");
  });
});
