import { updateMediaMetadata } from "@cms/actions/media.server";
import { act, render } from "@testing-library/react";

import type { MediaItem } from "@acme/types";

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

describe("MediaManager — replace feedback", () => {
  beforeEach(() => {
    libraryProps = null;
    mockUpdateMediaMetadata.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("provides replace success/error callbacks with proper logging", () => {
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
    expect(errorSpy).toHaveBeenNthCalledWith(
      1,
      "Replacement media item is missing a URL",
      { type: "image" }
    );

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

