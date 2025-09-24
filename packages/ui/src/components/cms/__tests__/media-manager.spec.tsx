import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MediaItem } from "@acme/types";

import { updateMediaMetadata } from "@cms/actions/media.server";
import MediaManager from "../MediaManager";

let libraryProps: any;

jest.mock("../media/Library", () => {
  const React = require("react");
  return function MockLibrary(props: any) {
    libraryProps = props;
    const { files, onDelete, onSelect } = props;
    return (
      <div>
        <h2>Library</h2>
        <ul>
          {files.map((file: any) => (
            <li key={file.url} data-cy="media-row">
              <span data-cy="media-title">{file.title ?? file.url}</span>
              <button
                type="button"
                onClick={() => onSelect?.(file)}
              >
                Edit {file.url}
              </button>
              <button
                type="button"
                onClick={() => onDelete(file.url)}
              >
                Delete {file.url}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };
});

jest.mock("../media/UploadPanel", () => () => (
  <div data-cy="upload-panel">Upload panel</div>
));

jest.mock("../media/details/MediaDetailsPanel", () => {
  const React = require("react");
  return function MockMediaDetailsPanel({
    open,
    item,
    loading,
    onSubmit,
    onClose,
  }: any) {
    const [title, setTitle] = React.useState(item.title ?? "");
    const [altText, setAltText] = React.useState(item.altText ?? "");
    const [tags, setTags] = React.useState(
      Array.isArray(item.tags) ? item.tags.join(", ") : ""
    );

    React.useEffect(() => {
      setTitle(item.title ?? "");
      setAltText(item.altText ?? "");
      setTags(Array.isArray(item.tags) ? item.tags.join(", ") : "");
    }, [item]);

    if (!open) return null;

    return (
      <div role="dialog" aria-label="Media details">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              title,
              altText,
              tags: tags
                .split(",")
                .map((value: string) => value.trim())
                .filter(Boolean),
            });
          }}
        >
          <label htmlFor="title-input">Title</label>
          <input
            id="title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <label htmlFor="alt-input">Alt text</label>
          <input
            id="alt-input"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
          />

          <label htmlFor="tags-input">Tags</label>
          <input
            id="tags-input"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    );
  };
});

jest.mock("@cms/actions/media.server", () => ({
  updateMediaMetadata: jest.fn(),
}));

const mockUpdateMediaMetadata =
  updateMediaMetadata as jest.MockedFunction<typeof updateMediaMetadata>;

const initialFiles: MediaItem[] = [
  {
    url: "https://cdn.example.com/first.jpg",
    type: "image",
    title: "First image",
    altText: "First alt",
    tags: ["alpha"],
  },
  {
    url: "https://cdn.example.com/second.jpg",
    type: "image",
    title: "Second image",
    altText: "Second alt",
    tags: ["beta"],
  },
];

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject } as const;
}

describe("MediaManager", () => {
  beforeEach(() => {
    libraryProps = null;
    mockUpdateMediaMetadata.mockReset();
    mockUpdateMediaMetadata.mockImplementation(async (_shop, url, fields) => ({
      url,
      type: "image",
      ...fields,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderManager(onDelete = jest.fn()) {
    render(
      <MediaManager
        shop="demo-shop"
        initialFiles={initialFiles}
        onDelete={onDelete}
        onMetadataUpdate={mockUpdateMediaMetadata}
      />
    );
    return { onDelete };
  }

  it("does not delete the item when the browser confirm dialog is cancelled", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderManager();
    // Confirm flow is handled via window.confirm in tests
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(
      screen.getByRole("button", { name: "Delete https://cdn.example.com/first.jpg" })
    );
    expect(confirmSpy).toHaveBeenCalledWith("Delete media?");
    confirmSpy.mockRestore();

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getAllByTestId("media-row")).toHaveLength(2);
    expect(screen.queryByTestId("media-manager-toast")).not.toBeInTheDocument();
  });

  it("removes the media item and shows a success toast when deletion is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    renderManager(onDelete);
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(
      screen.getByRole("button", { name: "Delete https://cdn.example.com/first.jpg" })
    );
    confirmSpy.mockRestore();

    await waitFor(() =>
      expect(onDelete).toHaveBeenCalledWith(
        "demo-shop",
        "https://cdn.example.com/first.jpg"
      )
    );
    await waitFor(() =>
      expect(screen.getAllByTestId("media-row")).toHaveLength(1)
    );
    expect(
      screen.getByText("Second image", { selector: "[data-cy='media-title']" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Media deleted.")).toBeInTheDocument();
  });

  it("shows an error toast when deletion fails", async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const onDelete = jest.fn().mockRejectedValue(new Error("delete failed"));
    renderManager(onDelete);
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(
      screen.getByRole("button", { name: "Delete https://cdn.example.com/first.jpg" })
    );
    confirmSpy.mockRestore();

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Failed to delete media item.")).toBeInTheDocument();
    expect(screen.getAllByTestId("media-row")).toHaveLength(2);
    errorSpy.mockRestore();
  });

  it("saves metadata, updates the list, shows a toast, and keeps the details panel open", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<MediaItem>();
    mockUpdateMediaMetadata.mockImplementation(() => deferred.promise);

    renderManager();

    await user.click(
      screen.getByRole("button", { name: "Edit https://cdn.example.com/first.jpg" })
    );

    const titleInput = screen.getByLabelText("Title");
    const altInput = screen.getByLabelText("Alt text");
    const tagsInput = screen.getByLabelText("Tags");

    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");
    await user.clear(altInput);
    await user.type(altInput, "Updated alt");
    await user.clear(tagsInput);
    await user.type(tagsInput, "fresh, spring");

    await user.click(screen.getByRole("button", { name: "Save" }));

    const savingButton = await screen.findByRole("button", { name: "Saving…" });
    expect(savingButton).toBeDisabled();

    deferred.resolve({
      url: "https://cdn.example.com/first.jpg",
      type: "image",
      title: "Updated title",
      altText: "Updated alt",
      tags: ["fresh", "spring"],
    });

    await waitFor(() =>
      expect(mockUpdateMediaMetadata).toHaveBeenCalledWith(
        "demo-shop",
        "https://cdn.example.com/first.jpg",
        {
          title: "Updated title",
          altText: "Updated alt",
          tags: ["fresh", "spring"],
        }
      )
    );

    expect(await screen.findByText("Media details updated.")).toBeInTheDocument();

    expect(
      screen.getByRole("dialog", { name: "Media details" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();

    const titles = screen
      .getAllByTestId("media-title")
      .map((node) => node.textContent);
    expect(titles).toEqual(["Updated title", "Second image"]);
  });

  it("re-enables the details form and shows an error toast when saving fails", async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const deferred = createDeferred<MediaItem>();
    mockUpdateMediaMetadata.mockImplementation(() => deferred.promise);

    renderManager();

    await user.click(
      screen.getByRole("button", { name: "Edit https://cdn.example.com/first.jpg" })
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    const savingButton = await screen.findByRole("button", { name: "Saving…" });
    expect(savingButton).toBeDisabled();

    deferred.reject(new Error("update failed"));

    expect(await screen.findByText("Failed to update media metadata.")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled()
    );
    expect(screen.getByRole("dialog", { name: "Media details" })).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it("provides replace feedback callbacks", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={jest.fn()}
        onMetadataUpdate={jest.fn()}
      />
    );

    expect(typeof libraryProps.onReplaceSuccess).toBe("function");
    expect(typeof libraryProps.onReplaceError).toBe("function");

    act(() => {
      libraryProps.onReplace?.("https://cdn.example.com/first.jpg");
    });
    act(() => {
      libraryProps.onReplaceSuccess?.({ url: "3", type: "image" });
    });
    expect(errorSpy).not.toHaveBeenCalled();

    act(() => {
      libraryProps.onReplace?.("https://cdn.example.com/first.jpg");
    });
    act(() => {
      libraryProps.onReplaceSuccess?.({ type: "image" });
    });
    expect(errorSpy).toHaveBeenNthCalledWith(1, "Replacement media item is missing a URL", { type: "image" });

    act(() => {
      libraryProps.onReplace?.("https://cdn.example.com/first.jpg");
    });
    act(() => {
      libraryProps.onReplaceError?.("something went wrong");
    });
    expect(errorSpy).toHaveBeenLastCalledWith(
      "Failed to replace media item",
      "something went wrong"
    );

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
