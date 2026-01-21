import { deleteMedia } from "@cms/actions/media.server";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useImageOrientationValidation } from "@acme/ui/hooks/useImageOrientationValidation";

import MediaManager from "../MediaManager";

jest.mock("@cms/actions/media.server", () => ({
  deleteMedia: jest.fn(),
}));

function createShadcnStub() {
  const React = require("react");
  const passthrough = (tag = "div") => {
    const Comp = React.forwardRef(function PassthroughComponent(
      { asChild: _asChild, ...props }: any,
      ref: any
    ) {
      return React.createElement(tag, { ref, ...props });
    });
    (Comp as any).displayName = `Passthrough(${tag})`;
    return Comp;
  };
  return {
    Input: passthrough("input"),
    Textarea: passthrough("textarea"),
    Button: passthrough("button"),
    Card: passthrough("div"),
    CardContent: passthrough("div"),
    Checkbox: (() => {
      const Checkbox = React.forwardRef(function CheckboxMock(
        props: any,
        ref: any
      ) {
        return <input ref={ref} type="checkbox" {...props} />;
      });
      (Checkbox as any).displayName = "CheckboxMock";
      return Checkbox;
    })(),
    Progress: passthrough(),
    Tag: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, asChild, ...rest }: any) => {
      const React = require("react");
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, rest);
      }
      return (
        <button type="button" {...rest}>
          {children}
        </button>
      );
    },
    DropdownMenuContent: ({ children, asChild: _asChild, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    DropdownMenuItem: ({
      children,
      onSelect,
      asChild: _asChild,
      ...rest
    }: any) => (
      <div
        role="menuitem"
        tabIndex={0}
        onClick={(event) => onSelect?.(event)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect?.(event);
          }
        }}
        {...rest}
      >
        {children}
      </div>
    ),
    DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
    Select: ({ children, ...rest }: any) => <select {...rest}>{children}</select>,
    SelectTrigger: ({ children, asChild: _asChild, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, ...rest }: any) => (
      <option {...rest}>{children}</option>
    ),
    Dialog: ({ children, onOpenChange, open, asChild: _asChild, ...rest }: any) => (
      <div {...rest} data-open={open ? "true" : undefined}>
        {children}
      </div>
    ),
    DialogContent: passthrough(),
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
  };
}

jest.mock("@acme/ui/components/atoms/shadcn", () =>
  require("./test-utils/shadcnStub").createShadcnStub()
);
jest.mock("../../atoms/shadcn", () =>
  require("./test-utils/shadcnStub").createShadcnStub()
);

jest.mock("@acme/ui/hooks/useImageOrientationValidation");

const mockHook = useImageOrientationValidation as jest.MockedFunction<
  typeof useImageOrientationValidation
>;
const mockDelete = deleteMedia as jest.MockedFunction<typeof deleteMedia>;
const mockMetadataUpdate = jest.fn();

beforeEach(() => {
  mockHook.mockReturnValue({ actual: null, isValid: null });
  mockDelete.mockResolvedValue(undefined as any);
  mockMetadataUpdate.mockReset();
  mockMetadataUpdate.mockImplementation(async (_shop: string, url: string) => ({
    url,
    type: "image",
  }));
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: "/new.png", altText: "a", type: "image" }),
  } as any);
  (global as any).URL.createObjectURL = jest.fn(() => "blob:url");
  (global as any).URL.revokeObjectURL = jest.fn();
});

describe("MediaManager – upload", () => {
  it("uploads file with alt text", async () => {
    mockHook.mockReturnValue({ actual: "landscape", isValid: true });
    const file = new File(["a"], "a.png", { type: "image/png" });
    render(
      <MediaManager
        shop="s"
        initialFiles={[]}
        onDelete={mockDelete}
        onMetadataUpdate={mockMetadataUpdate}
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
});
