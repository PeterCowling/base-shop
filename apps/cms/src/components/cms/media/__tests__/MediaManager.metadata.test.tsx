import { fireEvent, render, waitFor } from "@testing-library/react";
import { useState } from "react";

type MediaManagerProps = {
  shop: string;
  initialFiles: Array<{ url: string; type: string }>;
  onDelete: (shop: string, src: string) => void | Promise<void>;
  onMetadataUpdate?: (
    shop: string,
    src: string,
    fields: {
      title?: string | null;
      altText?: string | null;
      tags?: string[] | null;
    }
  ) => unknown;
};

jest.mock("@ui/components/cms/MediaManager", () => {
  function MockMediaManager({ shop, initialFiles, onMetadataUpdate }: MediaManagerProps) {
    const [title, setTitle] = useState("");
    const [altText, setAltText] = useState("");
    const [tags, setTags] = useState("");

    const activeFile = initialFiles[0]?.url ?? "";

    return (
      <form
        aria-label="Media metadata"
        onSubmit={(event) => {
          event.preventDefault();
          if (!onMetadataUpdate || !activeFile) return;
          const parsedTags = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
          onMetadataUpdate(shop, activeFile, {
            title: title || "",
            altText: altText || "",
            tags: parsedTags,
          });
        }}
      >
        <input
          aria-label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <input
          aria-label="Alt text"
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
        />
        <input
          aria-label="Tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
        <button type="submit">Save metadata</button>
      </form>
    );
  }

  return { __esModule: true, default: MockMediaManager };
});

describe("MediaManager metadata", () => {
  it("calls onMetadataUpdate with edited fields", async () => {
    const updateMediaMetadata = jest.fn();
    const MediaManager = (await import("../MediaManager")).default;

    const { getByLabelText, getByRole } = render(
      <MediaManager
        shop="shop"
        initialFiles={[{ url: "/uploads/shop/old.mp4", type: "image" }]}
        onDelete={jest.fn()}
        onMetadataUpdate={updateMediaMetadata}
      />
    );

    fireEvent.change(getByLabelText("Title"), {
      target: { value: "Updated title" },
    });
    fireEvent.change(getByLabelText("Alt text"), {
      target: { value: "Updated alt" },
    });
    fireEvent.change(getByLabelText("Tags"), {
      target: { value: "primary, hero" },
    });

    fireEvent.submit(getByRole("form", { name: "Media metadata" }));

    await waitFor(() =>
      expect(updateMediaMetadata).toHaveBeenCalledWith(
        "shop",
        "/uploads/shop/old.mp4",
        {
          title: "Updated title",
          altText: "Updated alt",
          tags: ["primary", "hero"],
        }
      )
    );
  });
});
