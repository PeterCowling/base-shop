import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import MediaManager from "../MediaManager";

let libraryProps: any;
let uploadProps: any;

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
      await libraryProps.onDelete("1");
    });

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(libraryProps.files).toHaveLength(2));
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
      await libraryProps.onDelete("1");
    });

    const confirmButton = await screen.findByRole("button", {
      name: "Delete media",
    });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("s", "1"));
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

