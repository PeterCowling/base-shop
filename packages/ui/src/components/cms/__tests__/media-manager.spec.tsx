import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MediaItem } from "@acme/types";
import { updateMediaMetadata } from "@cms/actions/media.server";
import MediaManager from "../MediaManager";

jest.mock("@cms/actions/media.server", () => ({
  updateMediaMetadata: jest.fn(),
}));

jest.mock("../media/UploadPanel", () => () => (
  <div data-testid="upload-panel">Upload panel</div>
));

jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  const passthrough = (tag = "div") =>
    React.forwardRef(({ asChild: _asChild, children, ...rest }: any, ref: any) =>
      React.createElement(tag, { ref, ...rest }, children)
    );
  return {
    Input: passthrough("input"),
    Textarea: passthrough("textarea"),
    Button: React.forwardRef(
      (
        { children, type = "button", ...rest }: any,
        ref: any
      ) => (
        <button ref={ref} type={type} {...rest}>
          {children}
        </button>
      )
    ),
    Card: passthrough("div"),
    CardContent: passthrough("div"),
    Checkbox: React.forwardRef((props: any, ref: any) => (
      <input ref={ref} type="checkbox" {...props} />
    )),
    Progress: passthrough("div"),
    Tag: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: React.forwardRef(
      ({ children, asChild, ...rest }: any, ref: any) => {
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, { ref, ...rest });
        }
        return (
          <button ref={ref} type="button" {...rest}>
            {children}
          </button>
        );
      }
    ),
    DropdownMenuContent: passthrough("div"),
    DropdownMenuItem: React.forwardRef(
      ({ children, onSelect, asChild: _asChild, ...rest }: any, ref: any) => (
        <button
          ref={ref}
          type="button"
          onClick={(event) => onSelect?.(event)}
          {...rest}
        >
          {children}
        </button>
      )
    ),
    DropdownMenuLabel: ({ children, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    DropdownMenuSeparator: () => <hr />,
    Select: ({ children }: any) => <div>{children}</div>,
    SelectTrigger: passthrough("div"),
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, onSelect }: any) => (
      <button type="button" onClick={(event) => onSelect?.(event)}>
        {children}
      </button>
    ),
    Dialog: ({ children, open }: any) => (
      <div data-open={open ? "true" : undefined}>{children}</div>
    ),
    DialogContent: passthrough("div"),
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
  };
});

type UpdateMetadataMock = jest.MockedFunction<typeof updateMediaMetadata>;
const mockedUpdateMediaMetadata = updateMediaMetadata as UpdateMetadataMock;

const originalConfirm = window.confirm;

function createInitialFiles(): MediaItem[] {
  return [
    {
      url: "/media/alpha.jpg",
      type: "image",
      title: "Alpha",
      altText: "Alpha alt",
      tags: ["hero"],
    },
    {
      url: "/media/bravo.jpg",
      type: "image",
      title: "Bravo",
      altText: "Bravo alt",
      tags: ["catalog"],
    },
  ];
}

describe("MediaManager interactions", () => {
  afterEach(() => {
    window.confirm = originalConfirm;
    mockedUpdateMediaMetadata.mockReset();
    jest.clearAllMocks();
  });

  it("keeps the item when deletion is cancelled", async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);
    const onDelete = jest.fn();

    render(
      <MediaManager
        shop="demo"
        initialFiles={createInitialFiles()}
        onDelete={onDelete}
        onMetadataUpdate={mockedUpdateMediaMetadata}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Media actions" })[0]);
    await user.click(
      screen.getAllByRole("button", { name: "Delete media" })[0]
    );

    expect(window.confirm).toHaveBeenCalledWith("Delete this image?");
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Open details" })
    ).toHaveLength(2);
  });

  it("removes the file and shows a success toast when deletion is confirmed", async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);
    const onDelete = jest.fn().mockResolvedValue(undefined);

    render(
      <MediaManager
        shop="demo"
        initialFiles={createInitialFiles()}
        onDelete={onDelete}
        onMetadataUpdate={mockedUpdateMediaMetadata}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Media actions" })[0]);
    await user.click(
      screen.getAllByRole("button", { name: "Delete media" })[0]
    );

    await waitFor(() =>
      expect(onDelete).toHaveBeenCalledWith("demo", "/media/alpha.jpg")
    );

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Media deleted.");
    expect(toast).toHaveAttribute("data-variant", "success");

    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Open details" })
      ).toHaveLength(1)
    );
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("saves metadata through the details panel and closes it on success", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    let resolveUpdate: ((item: MediaItem) => void) | undefined;
    mockedUpdateMediaMetadata.mockImplementation(
      () =>
        new Promise<MediaItem>((resolve) => {
          resolveUpdate = resolve;
        })
    );

    render(
      <MediaManager
        shop="demo"
        initialFiles={createInitialFiles()}
        onDelete={onDelete}
        onMetadataUpdate={mockedUpdateMediaMetadata}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Open details" })[0]);

    const titleInput = await screen.findByLabelText("Title");
    const altInput = screen.getByLabelText("Alt text");
    const tagsInput = screen.getByLabelText("Tags");

    await user.clear(titleInput);
    await user.type(titleInput, "Updated Alpha");
    await user.clear(altInput);
    await user.type(altInput, "Updated alt");
    await user.clear(tagsInput);
    await user.type(tagsInput, "featured, hero");

    const saveButton = screen.getByRole("button", { name: "Save" });
    await user.click(saveButton);
    await waitFor(() => expect(saveButton).toBeDisabled());

    resolveUpdate?.({
      url: "/media/alpha.jpg",
      type: "image",
      title: "Updated Alpha",
      altText: "Updated alt",
      tags: ["featured", "hero"],
    });

    await waitFor(() => expect(saveButton).not.toBeInTheDocument());
    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Media details saved.");
    expect(toast).toHaveAttribute("data-variant", "success");
    expect(
      mockedUpdateMediaMetadata
    ).toHaveBeenCalledWith("demo", "/media/alpha.jpg", {
      title: "Updated Alpha",
      altText: "Updated alt",
      tags: ["featured", "hero"],
    });
    await screen.findByText("Updated Alpha");
  });

  it("announces an error toast when metadata update fails", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    let rejectUpdate: ((reason?: unknown) => void) | undefined;
    mockedUpdateMediaMetadata.mockImplementation(
      () =>
        new Promise<MediaItem>((_resolve, reject) => {
          rejectUpdate = reject;
        })
    );

    render(
      <MediaManager
        shop="demo"
        initialFiles={createInitialFiles()}
        onDelete={onDelete}
        onMetadataUpdate={mockedUpdateMediaMetadata}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Open details" })[0]);
    const saveButton = await screen.findByRole("button", { name: "Save" });

    await user.click(saveButton);
    await waitFor(() => expect(saveButton).toBeDisabled());
    rejectUpdate?.(new Error("nope"));

    await waitFor(() => expect(saveButton).not.toBeDisabled());
    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Failed to update media metadata.");
    expect(toast).toHaveAttribute("data-variant", "error");
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });
});
