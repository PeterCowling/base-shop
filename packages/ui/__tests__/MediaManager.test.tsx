import { deleteMedia } from "@cms/actions/media.server";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import MediaManager from "../components/cms/MediaManager";

jest.mock("@ui/hooks/useImageOrientationValidation");
jest.mock("@cms/actions/media.server");

const mockHook = useImageOrientationValidation as jest.MockedFunction<
  typeof useImageOrientationValidation
>;
const mockDelete = deleteMedia as jest.MockedFunction<typeof deleteMedia>;

beforeEach(() => {
  mockHook.mockReturnValue({ actual: null, isValid: null });
  mockDelete.mockResolvedValue(undefined as any);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: "/new.png", altText: "a", type: "image" }),
  } as any);
});

describe("MediaManager", () => {
  it("deletes file when confirmed", async () => {
    (global as any).confirm = jest.fn(() => true);
    render(
      <MediaManager
        shop="s"
        initialFiles={[{ url: "/img.jpg", type: "image" } as any]}
      />
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
    const drop = screen.getByText(
      "Drop image or video here or click to upload"
    );
    fireEvent.drop(drop, { dataTransfer: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText("Alt text"), {
      target: { value: "alt" },
    });
    fireEvent.click(screen.getByText("Upload"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const fd = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData;
    expect(fd.get("altText")).toBe("alt");
  });

  it("filters files by search query", () => {
    render(
      <MediaManager
        shop="s"
        initialFiles={[
          { url: "/a.jpg", type: "image" } as any,
          { url: "/b.jpg", type: "image" } as any,
        ]}
      />
    );
    expect(screen.getAllByText("Delete").length).toBe(2);
    fireEvent.change(screen.getByPlaceholderText("Search by filename or tag"), {
      target: { value: "a" },
    });
    expect(screen.getAllByText("Delete").length).toBe(1);
  });

  it("updates alt text inline", async () => {
    render(
      <MediaManager
        shop="s"
        initialFiles={[{ url: "/img.jpg", altText: "", type: "image" } as any]}
      />
    );
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByPlaceholderText("Alt text"), {
      target: { value: "new" },
    });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByText("new")).toBeInTheDocument();
  });
});
