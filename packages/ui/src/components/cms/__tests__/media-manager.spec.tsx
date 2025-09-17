import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@radix-ui/react-dropdown-menu",
  () => {
    const React = require("react");
    const withAsChild = (
      Component: any,
      options: { role?: string; extraProps?: Record<string, unknown> } = {}
    ) =>
      React.forwardRef((props: any, ref: React.Ref<any>) => {
        const {
          asChild,
          children,
          onSelect,
          sideOffset: _sideOffset,
          alignOffset: _alignOffset,
          collisionPadding: _collisionPadding,
          ...rest
        } = props;
        const merged: Record<string, unknown> = {
          ref,
          role: options.role,
          ...options.extraProps,
          ...rest,
        };
        if (onSelect && typeof merged.onClick !== "function") {
          merged.onClick = onSelect;
        }
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, merged);
        }
        return React.createElement(Component, merged, children);
      });

    return {
      __esModule: true,
      Root: ({ children }: any) => <div role="menu">{children}</div>,
      Trigger: withAsChild("button", {
        extraProps: { "aria-haspopup": "menu" },
      }),
      Portal: ({ children }: any) => children,
      Content: withAsChild("div"),
      Item: withAsChild("div", { role: "menuitem" }),
      CheckboxItem: withAsChild("div", { role: "menuitemcheckbox" }),
      RadioGroup: ({ children }: any) => <div>{children}</div>,
      RadioItem: withAsChild("div", { role: "menuitemradio" }),
      Label: ({ children }: any) => <div>{children}</div>,
      Separator: () => <hr />,
      Group: ({ children }: any) => <div>{children}</div>,
      Sub: ({ children }: any) => <div>{children}</div>,
      SubContent: withAsChild("div"),
      SubTrigger: withAsChild("button"),
      Shortcut: ({ children }: any) => <span>{children}</span>,
    };
  },
  { virtual: true }
);

import MediaManager from "../MediaManager";

let libraryProps: any;
let uploadProps: any;
let detailsPanelProps: any;

jest.mock("../media/Library", () => (props: any) => {
  libraryProps = props;
  return (
    <div data-testid="library">
      {props.files.map((file: any) => (
        <div key={file.url}>
          <button type="button" onClick={() => props.onDelete(file.url)}>
            Delete {file.url}
          </button>
          <button type="button" onClick={() => props.onOpenDetails?.(file)}>
            Details {file.url}
          </button>
        </div>
      ))}
    </div>
  );
});

jest.mock("../media/UploadPanel", () => (props: any) => {
  uploadProps = props;
  return <div data-testid="upload" />;
});

jest.mock("../media/MediaDetailsPanel", () => (props: any) => {
  detailsPanelProps = props;
  if (!props.open || !props.item) return null;
  return (
    <div data-testid="details-panel">
      <button type="button" onClick={() => props.onClose()}>
        Close panel
      </button>
      <button
        type="button"
        onClick={() =>
          props.onSave({
            title: "Updated",
            altText: "Alt",
            description: "",
            tags: ["hero"],
          })
        }
      >
        Trigger save
      </button>
    </div>
  );
});

describe("MediaManager", () => {
  const initialFiles = [
    { url: "1", type: "image", title: "One" },
    { url: "2", type: "image", title: "Two" },
  ];

  afterEach(() => {
    jest.clearAllMocks();
    libraryProps = undefined;
    uploadProps = undefined;
    detailsPanelProps = undefined;
  });

  it("opens a confirmation dialog and aborts when cancelled", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />
    );

    await user.click(screen.getByText("Delete 1"));
    const dialog = await screen.findByRole("dialog", { name: /delete media/i });

    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
    expect(libraryProps.files).toHaveLength(2);
  });

  it("confirms deletion, updates state, and shows toast feedback", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(
      <MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />
    );

    await user.click(screen.getByText("Delete 1"));
    const dialog = await screen.findByRole("dialog", { name: /delete media/i });
    await user.click(within(dialog).getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("s", "1"));
    await waitFor(() => expect(libraryProps.files).toHaveLength(1));
    expect(libraryProps.files[0].url).toBe("2");
    expect(screen.getByText(/media deleted\./i)).toBeInTheDocument();
  });

  it("adds uploaded items to the beginning of the library", async () => {
    const onDelete = jest.fn();
    render(
      <MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />
    );

    await act(async () => {
      uploadProps.onUploaded({ url: "3", type: "image" });
    });
    await waitFor(() => expect(libraryProps.files[0].url).toBe("3"));
    expect(libraryProps.files).toHaveLength(3);
  });

  it("replaces existing items when upload succeeds", async () => {
    const onDelete = jest.fn();
    render(
      <MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />
    );

    await act(async () => {
      libraryProps.onReplace("1", { url: "1b", type: "image" });
    });
    await waitFor(() => expect(libraryProps.files[0].url).toBe("1b"));
    expect(libraryProps.files[1].url).toBe("2");
  });

  it("saves metadata changes through the details panel", async () => {
    const user = userEvent.setup();
    const onUpdateMetadata = jest
      .fn()
      .mockResolvedValue({ url: "1", type: "image", title: "Updated", tags: ["hero"] });

    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={jest.fn()}
        onUpdateMetadata={onUpdateMetadata}
      />
    );

    await waitFor(() => expect(libraryProps.files).toHaveLength(2));
    await act(async () => {
      libraryProps.onOpenDetails(libraryProps.files[0]);
    });
    expect(detailsPanelProps.item.url).toBe("1");

    await user.click(screen.getByText("Trigger save"));

    await waitFor(() =>
      expect(onUpdateMetadata).toHaveBeenCalledWith("s", "1", {
        altText: "Alt",
        description: null,
        tags: ["hero"],
        title: "Updated",
      })
    );
    await waitFor(() => expect(libraryProps.files[0].title).toBe("Updated"));
    expect(screen.getByText(/media details updated/i)).toBeInTheDocument();
  });

  it("surfaces errors when metadata update fails", async () => {
    const user = userEvent.setup();
    const error = new Error("nope");
    const onUpdateMetadata = jest.fn().mockRejectedValue(error);

    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={jest.fn()}
        onUpdateMetadata={onUpdateMetadata}
      />
    );

    await act(async () => {
      libraryProps.onOpenDetails(libraryProps.files[0]);
    });
    expect(detailsPanelProps.item.url).toBe("1");

    await act(async () => {
      await expect(
        detailsPanelProps.onSave({
          title: "Updated",
          altText: "Alt",
          description: "",
          tags: ["hero"],
        })
      ).rejects.toThrow("nope");
    });

    expect(onUpdateMetadata).toHaveBeenCalled();
    expect(screen.getByText(/nope/i)).toBeInTheDocument();
    expect(libraryProps.files[0].title).toBe("One");
  });
});
