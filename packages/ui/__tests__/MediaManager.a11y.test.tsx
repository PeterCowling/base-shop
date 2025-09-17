import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@ui/hooks/useMediaUpload", () => ({
  __esModule: true,
  useMediaUpload: () => ({
    pendingFile: null,
    thumbnail: null,
    altText: "",
    setAltText: jest.fn(),
    actual: null,
    isValid: null,
    progress: null,
    error: "Upload failed",
    inputRef: { current: null },
    openFileDialog: jest.fn(),
    onDrop: jest.fn(),
    onFileChange: jest.fn(),
    handleUpload: jest.fn(),
  }),
}));


const MediaManager = require("@ui/components/cms/MediaManager").default;

describe("MediaManager accessibility", () => {
  it("links drop zone to live feedback region", () => {
    render(
      <MediaManager
        shop="s"
        initialFiles={[]}
        onDelete={jest.fn()}
        onMetadataUpdate={jest.fn()}
      />
    );
    const dropzone = screen.getByRole("button", {
      name: /drop image or video/i,
    });
    const status = screen.getByRole("status");
    expect(dropzone).toHaveAttribute("aria-describedby", status.id);
    expect(status).toHaveTextContent("Upload failed");
  });
});
