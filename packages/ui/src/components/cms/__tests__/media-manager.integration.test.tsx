import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MediaItem } from "@acme/types";
import { useCallback, useState } from "react";

import Library from "../media/Library";
import MediaManager from "../MediaManager";

jest.mock("@acme/ui/hooks/useMediaUpload", () => {
  const React = require("react");
  return {
    useMediaUpload: jest.fn((options: any) => {
      const { useState } = React;
      const [pendingFile, setPendingFile] = useState<any>(null);
      const [progress, setProgress] = useState<any>(null);

      const onDrop = (event: any) => {
        event.preventDefault?.();
        const file = event.dataTransfer?.files?.[0] ?? null;
        setPendingFile(file);
      };

      const onFileChange = (event: any) => {
        const file = event.target?.files?.[0] ?? null;
        setPendingFile(file);
      };

      const handleUpload = async () => {
        if (!pendingFile) return;
        setProgress({ done: 0, total: 1 });
        await options?.onUploaded?.({
          url: `https://cdn.example.com/${pendingFile.name}`,
          type: pendingFile.type?.startsWith("video/") ? "video" : "image",
          title: `Uploaded ${pendingFile.name}`,
          altText: `Uploaded ${pendingFile.name}`,
        });
        setProgress(null);
        setPendingFile(null);
      };

      return {
        pendingFile,
        thumbnail: null,
        altText: "",
        setAltText: () => {},
        tags: "",
        setTags: () => {},
        actual: "landscape",
        isValid: true,
        progress,
        error: undefined,
        inputRef: { current: null },
        openFileDialog: () => {},
        onDrop,
        onFileChange,
        handleUpload,
      };
    }),
  };
});

type ItemWithUrl = MediaItem & { url: string };

type BulkDeleteHandler = (items: ItemWithUrl[]) => void | Promise<void>;

function createDeferred<T>() {
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return {
    promise,
    resolve: resolve!,
  };
}

function BulkLibraryHarness({
  initialFiles,
  onBulkDelete,
}: {
  initialFiles: ItemWithUrl[];
  onBulkDelete: BulkDeleteHandler;
}) {
  const [files, setFiles] = useState<ItemWithUrl[]>(initialFiles);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(() => new Set());
  const [pendingDeletion, setPendingDeletion] = useState<Set<string>>(
    () => new Set()
  );
  const [confirming, setConfirming] = useState(false);

  const handleToggle = useCallback(
    (item: ItemWithUrl, selected: boolean) => {
      setSelectedUrls((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(item.url);
        } else {
          next.delete(item.url);
        }
        return next;
      });
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    const selectedItems = files.filter((file) => selectedUrls.has(file.url));
    const urls = selectedItems.map((file) => file.url);
    setPendingDeletion(new Set(urls));
    setConfirming(false);
    try {
      await onBulkDelete(selectedItems);
      setFiles((prev) => prev.filter((file) => !urls.includes(file.url)));
      setSelectedUrls(new Set());
    } finally {
      setPendingDeletion(new Set());
    }
  }, [files, onBulkDelete, selectedUrls]);

  const handleCancel = useCallback(() => {
    setConfirming(false);
  }, []);

  const selectionCount = selectedUrls.size;

  return (
    <div>
      <Library
        files={files}
        shop="demo"
        onDelete={() => {}}
        onReplace={() => {}}
        selectionEnabled
        onBulkToggle={handleToggle}
        isItemSelected={(item) => selectedUrls.has(item.url)}
        isDeleting={(item) => pendingDeletion.has(item.url)}
      />
      <div data-cy="selection-summary">{selectionCount} selected</div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={selectionCount === 0}
      >
        Delete selected
      </button>
      {confirming ? (
        <div
          role="dialog"
          aria-label={`Delete ${selectionCount} media files`}
          className="space-y-2"
        >
          <p>Delete {selectionCount} media files?</p>
          <button type="button" onClick={handleConfirm}>
            Confirm delete
          </button>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

describe("Media manager integration", () => {
  it("supports selecting multiple items, confirming bulk delete, and preserving selection on cancel", async () => {
    const user = userEvent.setup();
    const initialFiles: ItemWithUrl[] = [
      {
        url: "https://cdn.example.com/alpha.jpg",
        type: "image",
        title: "Alpha image",
        altText: "Alpha alt",
      },
      {
        url: "https://cdn.example.com/bravo.jpg",
        type: "image",
        title: "Bravo image",
        altText: "Bravo alt",
      },
      {
        url: "https://cdn.example.com/charlie.jpg",
        type: "image",
        title: "Charlie image",
        altText: "Charlie alt",
      },
    ];
    const deferred = createDeferred<void>();
    const handleBulkDelete = jest.fn(() => deferred.promise);

    render(
      <BulkLibraryHarness
        initialFiles={initialFiles}
        onBulkDelete={handleBulkDelete}
      />
    );

    const firstCard = screen
      .getByText("Alpha image")
      .closest("[data-selected]") as HTMLElement;
    const secondCard = screen
      .getByText("Bravo image")
      .closest("[data-selected]") as HTMLElement;
    await user.click(within(firstCard).getByRole("checkbox"));
    await user.click(within(secondCard).getByRole("checkbox"));

    expect(firstCard.getAttribute("data-selected")).toBe("true");
    expect(secondCard.getAttribute("data-selected")).toBe("true");
    expect(screen.getByTestId("selection-summary")).toHaveTextContent(
      "2 selected"
    );

    const deleteButton = screen.getByRole("button", { name: /delete selected/i });
    await user.click(deleteButton);

    const dialog = screen.getByRole("dialog", {
      name: /delete 2 media files/i,
    });
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen
        .getByText("Alpha image")
        .closest("[data-selected]") as HTMLElement
    ).toHaveAttribute("data-selected", "true");
    expect(
      screen
        .getByText("Bravo image")
        .closest("[data-selected]") as HTMLElement
    ).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("selection-summary")).toHaveTextContent(
      "2 selected"
    );

    await user.click(deleteButton);
    await user.click(screen.getByRole("button", { name: /confirm delete/i }));

    expect(handleBulkDelete).toHaveBeenCalledTimes(1);
    expect(handleBulkDelete).toHaveBeenCalledWith([
      expect.objectContaining({ url: "https://cdn.example.com/alpha.jpg" }),
      expect.objectContaining({ url: "https://cdn.example.com/bravo.jpg" }),
    ]);

    const overlays = await screen.findAllByText(/Deleting media/i, { selector: 'p' });
    expect(overlays).toHaveLength(2);

    deferred.resolve();
    await waitFor(() =>
      expect(screen.queryByText("Alpha image")).not.toBeInTheDocument()
    );
    expect(screen.queryByText("Bravo image")).not.toBeInTheDocument();
    expect(screen.getByText("Charlie image")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/Deleting media/i)).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /delete selected/i })).toBeDisabled()
    );
    expect(screen.getByTestId("selection-summary")).toHaveTextContent(
      "0 selected"
    );
  });

  it("adds uploaded media when using drag-and-drop", async () => {
    const user = userEvent.setup();
    const initialFiles: ItemWithUrl[] = [
      {
        url: "https://cdn.example.com/existing-1.jpg",
        type: "image",
        title: "Existing asset one",
        altText: "Existing one",
      },
      {
        url: "https://cdn.example.com/existing-2.jpg",
        type: "image",
        title: "Existing asset two",
        altText: "Existing two",
      },
    ];

    render(
      <MediaManager
        shop="demo-shop"
        initialFiles={initialFiles}
        onDelete={jest.fn()}
        onMetadataUpdate={jest.fn(async (_shop, url, fields) => ({
          url,
          type: "image",
          ...fields,
        }))}
      />
    );

    const dropzone = screen.getByRole("button", {
      name: /drop image or video here/i,
    });

    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass("ring-2");
    expect(dropzone).toHaveClass("ring-primary/60");
    expect(dropzone).toHaveClass("bg-primary/5");
    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass("ring-2");
    expect(dropzone).not.toHaveClass("ring-primary/60");
    expect(dropzone).not.toHaveClass("bg-primary/5");

    fireEvent.dragEnter(dropzone);
    const file = new File(["binary"], "hero.png", { type: "image/png" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(dropzone).not.toHaveClass("ring-2");
    expect(dropzone).not.toHaveClass("ring-primary/60");
    expect(dropzone).not.toHaveClass("bg-primary/5");

    await screen.findByPlaceholderText("Alt text");

    await user.click(screen.getByRole("button", { name: "Upload" }));

    const uploadedLabels = await screen.findAllByText("Uploaded hero.png");
    expect(uploadedLabels.length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Media actions", hidden: true })
      ).toHaveLength(3)
    );
    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Alt text")).not.toBeInTheDocument()
    );
    expect(screen.queryByText(/Uploaded 0\/1/i)).not.toBeInTheDocument();
  });
});
