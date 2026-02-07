import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import { promises as fs } from "fs";

// Path to component relative to this test file
import EditPreviewPage from "../src/app/cms/shop/[shop]/edit-preview/EditPreviewPage";

describe("EditPreviewPage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders list of changed components", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        JSON.stringify({
          components: [
            { file: "a.tsx", componentName: "CompA" },
            { file: "b.tsx", componentName: "CompB" },
          ],
        }),
      );

    const Page = await EditPreviewPage({ shop: "demo" });
    render(Page);
    expect(screen.getByText("CompA")).toBeInTheDocument();
    expect(screen.getByText("CompB")).toBeInTheDocument();
  });

  it("renders fallback when no changes", async () => {
    jest.spyOn(fs, "readFile").mockRejectedValue(new Error("not found"));
    const Page = await EditPreviewPage({ shop: "demo" });
    render(Page);
    expect(screen.getByText("No changes.")).toBeInTheDocument();
  });
});
