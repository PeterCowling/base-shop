import {
  render,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import type { MediaItem } from "@acme/types";

jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  const passthrough = (tag = "div") =>
    React.forwardRef(
      (
        {
          asChild: _asChild,
          onPointerDownOutside: _onPointerDownOutside,
          onEscapeKeyDown: _onEscapeKeyDown,
          onOpenChange: _onOpenChange,
          onValueChange: _onValueChange,
          ...props
        }: any,
        ref: any
      ) => React.createElement(tag, { ref, ...props })
    );
  return {
    Input: passthrough("input"),
    Textarea: passthrough("textarea"),
    Button: passthrough("button"),
    Card: passthrough("div"),
    CardContent: passthrough("div"),
    Checkbox: React.forwardRef((props: any, ref: any) => (
      <input ref={ref} type="checkbox" {...props} />
    )),
    Progress: passthrough(),
    Tag: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, asChild, ...rest }: any) => {
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
        {...rest}
      >
        {children}
      </div>
    ),
    DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
    Select: passthrough(),
    SelectTrigger: passthrough(),
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: passthrough(),
    SelectItem: ({ children, onSelect, asChild: _asChild, ...rest }: any) => (
      <div onClick={(event) => onSelect?.(event)} {...rest}>
        {children}
      </div>
    ),
    Dialog: ({ children, asChild: _asChild, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    DialogContent: passthrough(),
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
  };
});
import MediaManager from "../MediaManager";

describe("MediaManager", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("uploads dropped files and shows progress", async () => {
    const onDelete = jest.fn();
    let resolveFetch: (value: Response) => void;
    global.fetch = jest.fn(
      () =>
        new Promise((res) => {
          resolveFetch = res;
        })
    ) as any;

    const { getByLabelText, getByText, queryByText, queryAllByText } = render(
      <MediaManager
        shop="shop"
        initialFiles={[]}
        onDelete={onDelete}
        onMetadataUpdate={jest.fn()}
      />
    );

    const dropzone = getByLabelText(/drop image or video here/i);
    const file = new File(["file"], "video.mp4", { type: "video/mp4" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    const uploadButton = getByText("Upload");
    fireEvent.click(uploadButton);

    await act(async () => {
      resolveFetch!(
        new Response(
          JSON.stringify({ url: "new.mp4", type: "video" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });
    await waitFor(() =>
      expect(queryByText("Uploaded 0/1")).not.toBeInTheDocument()
    );
    await waitFor(() => expect(queryAllByText("Delete").length).toBe(1));
  });

  it("calls onDelete when confirming deletion", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByRole, queryByText } = render(
      <MediaManager
        shop="shop"
        initialFiles={[{ url: "old.mp4", type: "video" }]}
        onDelete={onDelete}
        onMetadataUpdate={jest.fn()}
      />
    );

    fireEvent.click(getByRole("button", { name: "Media actions" }));
    const deleteButton = getByText("Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getByRole("button", { name: "Delete media" }));

    await waitFor(() =>
      expect(onDelete).toHaveBeenCalledWith("shop", "old.mp4")
    );
    await waitFor(() =>
      expect(queryByText("Delete")).not.toBeInTheDocument()
    );
  });

  it("displays error message when upload fails", async () => {
    const onDelete = jest.fn();
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Upload failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    ) as any;

    const { getByLabelText, getByText, findByText } = render(
      <MediaManager
        shop="shop"
        initialFiles={[]}
        onDelete={onDelete}
        onMetadataUpdate={jest.fn()}
      />
    );

    const dropzone = getByLabelText(/drop image or video here/i);
    const file = new File(["file"], "video.mp4", { type: "video/mp4" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    fireEvent.click(getByText("Upload"));

    await findByText("Upload failed");
  });

  it("submits metadata updates when saving details", async () => {
    const onDelete = jest.fn();
    const onMetadataUpdate = jest
      .fn<
        (
          shop: string,
          url: string,
          fields: { title: string; altText: string; tags: string[] }
        ) => Promise<MediaItem>
      >()
      .mockImplementation(async (_shop, url, fields) => ({
        url,
        type: "video",
        ...fields,
      }));

    const { getByText, findByLabelText, findByRole } = render(
      <MediaManager
        shop="shop"
        initialFiles={[
          {
            url: "old.mp4",
            type: "video",
            title: "Old title",
            altText: "Old alt",
            tags: [],
          },
        ]}
        onDelete={onDelete}
        onMetadataUpdate={onMetadataUpdate}
      />
    );

    fireEvent.click(getByText("Open details"));

    const titleInput = await findByLabelText("Title");
    const altInput = await findByLabelText("Alt text");
    const tagsInput = await findByLabelText("Tags");

    fireEvent.change(titleInput, { target: { value: "New title" } });
    fireEvent.change(altInput, { target: { value: "New alt text" } });
    fireEvent.change(tagsInput, { target: { value: "featured, hero" } });

    const saveButton = await findByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(onMetadataUpdate).toHaveBeenCalledWith("shop", "old.mp4", {
        title: "New title",
        altText: "New alt text",
        tags: ["featured", "hero"],
      })
    );
  });
});
