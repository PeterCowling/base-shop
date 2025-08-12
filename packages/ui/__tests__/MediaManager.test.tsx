import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import MediaManager from "@ui/src/components/cms/MediaManager";

jest.mock("@ui/components/atoms/shadcn", () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock("@ui/hooks/useImageOrientationValidation");

const mockHook = useImageOrientationValidation as jest.MockedFunction<
  typeof useImageOrientationValidation
>;

beforeEach(() => {
  mockHook.mockReturnValue({ actual: null, isValid: null });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: "/new.png", altText: "a" }),
  } as any);
});

describe("MediaManager", () => {
  it("deletes file when confirmed", async () => {
    (global as any).confirm = jest.fn(() => true);
    const handleDelete = jest.fn();
    render(
      <MediaManager
        shop="s"
        initialFiles={[{ url: "/img.jpg" } as any]}
        onDelete={handleDelete}
      />
    );
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() =>
      expect(handleDelete).toHaveBeenCalledWith("s", "/img.jpg")
    );
  });

  it("uploads file with alt text", async () => {
    mockHook.mockReturnValue({ actual: "landscape", isValid: true });
    const file = new File(["a"], "a.png", { type: "image/png" });
    render(<MediaManager shop="s" initialFiles={[]} onDelete={jest.fn()} />);
    const drop = screen.getByText(
      "Drop image or video here or click to upload"
    );
    fireEvent.drop(drop, { dataTransfer: { files: [file] } });
    const input = await screen.findByPlaceholderText("Alt text");
    fireEvent.change(input, { target: { value: "alt" } });
    fireEvent.click(screen.getByText("Upload"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const fd = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData;
    expect(fd.get("altText")).toBe("alt");
  });
});
