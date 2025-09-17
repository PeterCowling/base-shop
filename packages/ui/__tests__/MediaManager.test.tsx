jest.mock("@cms/actions/media.server", () => ({
  deleteMedia: jest.fn(),
}));
jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  const Button = ({ children, ...rest }: any) => <button {...rest}>{children}</button>;
  const Dialog = ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null);
  const SimpleFragment = ({ children }: any) => <div>{children}</div>;
  return {
    Input: React.forwardRef((props, ref) => <input ref={ref} {...props} />),
    Select: ({ children, ...rest }: any) => <select {...rest}>{children}</select>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, ...rest }: any) => <option {...rest}>{children}</option>,
    Button,
    Dialog,
    DialogContent: SimpleFragment,
    DialogHeader: SimpleFragment,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: SimpleFragment,
    DialogFooter: SimpleFragment,
  };
});
jest.mock("@ui/components/cms/media/MediaDetailsPanel", () => () => <div data-testid="details" />);
import { deleteMedia } from "@cms/actions/media.server";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import MediaManager from "../src/components/cms/MediaManager";

jest.mock("@ui/hooks/useImageOrientationValidation");

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
  global.URL.createObjectURL = jest.fn(() => "blob:url");
  global.URL.revokeObjectURL = jest.fn();
});

describe("MediaManager", () => {
  it("deletes file when confirmed", async () => {
    (global as any).confirm = jest.fn(() => true);
    const onMetadataUpdate = jest
      .fn()
      .mockImplementation((_shop, url, fields) =>
        Promise.resolve({ url, ...fields })
      );
    render(
      <MediaManager
        shop="s"
        initialFiles={[{ url: "/img.jpg", type: "image" } as any]}
        onDelete={mockDelete}
        onMetadataUpdate={onMetadataUpdate}
      />
    );
    fireEvent.click(screen.getByText("Delete"));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));
    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("s", "/img.jpg")
    );
  });

  it("uploads file with alt text", async () => {
    mockHook.mockReturnValue({ actual: "landscape", isValid: true });
    const file = new File(["a"], "a.png", { type: "image/png" });
    const onMetadataUpdate = jest
      .fn()
      .mockImplementation((_shop, url, fields) =>
        Promise.resolve({ url, ...fields })
      );
    render(
      <MediaManager
        shop="s"
        initialFiles={[]}
        onDelete={mockDelete}
        onMetadataUpdate={onMetadataUpdate}
      />
    );
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
    const onMetadataUpdate = jest
      .fn()
      .mockImplementation((_shop, url, fields) =>
        Promise.resolve({ url, ...fields })
      );
    render(
      <MediaManager
        shop="s"
        initialFiles={[
          { url: "/a.jpg", altText: "Cat", type: "image" } as any,
          { url: "/dog.jpg", altText: "Dog", type: "image" } as any,
        ]}
        onDelete={mockDelete}
        onMetadataUpdate={onMetadataUpdate}
      />
    );
    expect(screen.getAllByText("Delete")).toHaveLength(2);
    fireEvent.change(screen.getByPlaceholderText("Search media..."), {
      target: { value: "dog" },
    });
    expect(screen.getAllByText("Delete")).toHaveLength(1);
  });
});
