import { render, screen } from "@testing-library/react";
import React from "react";
import MediaManager from "@ui/components/cms/MediaManager";

jest.mock("@ui/hooks/useMediaUpload", () => ({
  useMediaUpload: () => ({
    pendingFile: null,
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

describe("MediaManager accessibility", () => {
  it("links drop zone to live feedback region", () => {
    render(<MediaManager shop="s" initialFiles={[]} onDelete={jest.fn()} />);
    const dropzone = screen.getByRole("button", {
      name: /drop image or video/i,
    });
    const status = screen.getByRole("status");
    expect(dropzone).toHaveAttribute("aria-describedby", status.id);
    expect(status).toHaveTextContent("Upload failed");
  });
});
