import { fireEvent, render, waitFor, act } from "@testing-library/react";
import React from "react";
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

  const renderComponent = (overrides: Partial<React.ComponentProps<typeof MediaManager>> = {}) =>
    render(
      <MediaManager
        shop="s"
        initialFiles={initialFiles}
        onDelete={jest.fn().mockResolvedValue(undefined)}
        onMetadataUpdate={jest
          .fn()
          .mockImplementation((_shop, _url, fields) =>
            Promise.resolve({ url: _url, ...fields })
          )}
        {...overrides}
      />
    );

  it("closes the delete dialog when cancelled", async () => {
    const onDelete = jest.fn();
    const { getByRole, queryByRole } = renderComponent({ onDelete });

    await act(async () => {
      await libraryProps.onDelete("1");
    });

    expect(getByRole("dialog", { name: /delete media/i })).toBeInTheDocument();

    fireEvent.click(getByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(queryByRole("dialog")).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();
    expect(libraryProps.files).toHaveLength(2);
  });

  it("deletes item when confirmed", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const { getByRole } = renderComponent({ onDelete });

    await act(async () => {
      await libraryProps.onDelete("1");
    });

    fireEvent.click(getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("s", "1"));
    await waitFor(() => expect(libraryProps.files).toHaveLength(1));
    expect(libraryProps.files.find((f: any) => f.url === "1")).toBeUndefined();
  });

  it("adds uploaded items", async () => {
    const onDelete = jest.fn();
    renderComponent({ onDelete });

    act(() => {
      uploadProps.onUploaded({ url: "3", type: "image" });
    });

    await waitFor(() => expect(libraryProps.files[0].url).toBe("3"));
    expect(libraryProps.files).toHaveLength(3);
  });

  it("replaces existing items", async () => {
    const onDelete = jest.fn();
    renderComponent({ onDelete });

    act(() => {
      libraryProps.onReplace("1");
      libraryProps.onReplaceSuccess("1", { url: "1b", type: "image" });
    });

    await waitFor(() => expect(libraryProps.files[0].url).toBe("1b"));
    expect(libraryProps.files[1].url).toBe("2");
  });
});

