import { render, screen, waitFor } from "@testing-library/react";
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
              <button type="button" onClick={() => onSelect?.(file)}>
                Edit {file.url}
              </button>
              <button type="button" onClick={() => onDelete(file.url)}>
                Delete {file.url}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };
});

jest.mock("../media/UploadPanel", () => {
  function MockUploadPanel() {
    return <div data-cy="upload-panel">Upload panel</div>;
  }
  return MockUploadPanel;
});

jest.mock("../media/details/MediaDetailsPanel", () => {
  const React = require("react");
  return function MockMediaDetailsPanel({ open }: any) {
    if (!open) return null;
    return <div role="dialog" aria-label="Media details" />;
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

describe("MediaManager — delete", () => {
  beforeEach(() => {
    libraryProps = null;
    mockUpdateMediaMetadata.mockReset();
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

  it("does not delete when confirm is cancelled", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderManager();
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(
      screen.getByRole("button", {
        name: "Delete https://cdn.example.com/first.jpg",
      })
    );
    expect(confirmSpy).toHaveBeenCalledWith("Delete media?");
    confirmSpy.mockRestore();

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getAllByTestId("media-row")).toHaveLength(2);
    expect(screen.queryByTestId("media-manager-toast")).not.toBeInTheDocument();
  });

  it("deletes the item and shows success toast", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    renderManager(onDelete);
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(
      screen.getByRole("button", {
        name: "Delete https://cdn.example.com/first.jpg",
      })
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
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(
      screen.getByRole("button", {
        name: "Delete https://cdn.example.com/first.jpg",
      })
    );
    confirmSpy.mockRestore();

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText("Failed to delete media item.")
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("media-row")).toHaveLength(2);
    errorSpy.mockRestore();
  });
});

