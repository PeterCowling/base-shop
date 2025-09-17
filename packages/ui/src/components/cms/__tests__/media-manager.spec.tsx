import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import MediaManager from "../MediaManager";

let libraryProps: any;
let uploadProps: any;

jest.mock("../../atoms/shadcn", () => {
  const React = require("react");
  const base = require("../../../../../../test/__mocks__/shadcnDialogStub.tsx");

  const withChildren = (Tag: any) =>
    ({ children, ...props }: any) =>
      React.createElement(Tag, props, children);

  return {
    __esModule: true,
    ...base,
    Dialog: ({ open, onOpenChange, children }: any) =>
      React.createElement(base.Dialog, { open, onOpenChange, children }),
    DialogHeader: withChildren("div"),
    DialogFooter: withChildren("div"),
    DialogDescription: withChildren("p"),
  };
});

jest.mock("../media/Library", () => (props: any) => {
  libraryProps = props;
  return <div data-testid="library" />;
});

jest.mock("../media/UploadPanel", () => (props: any) => {
  uploadProps = props;
  return <div data-testid="upload" />;
});

describe("MediaManager", () => {
  const initialFiles = [
    { url: "1", type: "image" },
    { url: "2", type: "image" },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when deletion is not confirmed", async () => {
    const onDelete = jest.fn();
    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={onDelete}
        onMetadataUpdate={jest.fn()}
      />
    );

    await act(async () => {
      libraryProps.onDelete("1");
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    });

    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(libraryProps.files).toHaveLength(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes item when confirmed", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={onDelete}
        onMetadataUpdate={jest.fn()}
      />
    );

    await act(async () => {
      libraryProps.onDelete("1");
    });

    const confirmButton = screen.getByRole("button", { name: /delete/i });

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(onDelete).toHaveBeenCalledWith("s", "1");
    await waitFor(() => expect(libraryProps.files).toHaveLength(1));
    expect(libraryProps.files.find((f: any) => f.url === "1")).toBeUndefined();
  });

  it("adds uploaded items", async () => {
    const onDelete = jest.fn();
    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={onDelete}
        onMetadataUpdate={jest.fn()}
      />
    );

    act(() => {
      uploadProps.onUploaded({ url: "3", type: "image" });
    });

    await waitFor(() => expect(libraryProps.files[0].url).toBe("3"));
    expect(libraryProps.files).toHaveLength(3);
  });

  it("replaces existing items", async () => {
    const onDelete = jest.fn();
    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={onDelete}
        onMetadataUpdate={jest.fn()}
      />
    );

    act(() => {
      libraryProps.onReplace("1", { url: "1b", type: "image" });
    });

    await waitFor(() => expect(libraryProps.files[0].url).toBe("1b"));
    expect(libraryProps.files[1].url).toBe("2");
  });
});

