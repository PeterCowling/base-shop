import { deleteMedia } from "@cms/actions/media.server";
import { fireEvent,render, screen } from "@testing-library/react";

import { useImageOrientationValidation } from "../../../hooks/useImageOrientationValidation";
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

jest.mock("@acme/design-system/shadcn", () =>
  require("./test-utils/shadcnStub").createShadcnStub()
);
jest.mock("../../atoms/shadcn", () =>
  require("./test-utils/shadcnStub").createShadcnStub()
);

jest.mock("../../../hooks/useImageOrientationValidation");

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

describe("MediaManager – filtering", () => {
  it("filters files by search query", () => {
    render(
      <MediaManager
        shop="s"
        initialFiles={[
          { url: "/a.jpg", altText: "Cat", type: "image" } as any,
          { url: "/dog.jpg", altText: "Dog", type: "image" } as any,
        ]}
        onDelete={mockDelete}
        onMetadataUpdate={mockMetadataUpdate}
      />
    );
    expect(
      screen.getAllByRole("button", { name: /Delete media/i })
    ).toHaveLength(2);
    fireEvent.change(screen.getByPlaceholderText("Search media..."), {
      target: { value: "dog" },
    });
    expect(
      screen.getAllByRole("button", { name: /Delete media/i })
    ).toHaveLength(1);
  });
});
