/** @jest-environment jsdom */

import * as React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { CatalogProductForm } from "../CatalogProductForm.client";
import type { ActionFeedback } from "../useCatalogConsole.client";

const catalogProductBaseFieldsMock = jest.fn(() => <div data-cy="base-fields" />);

jest.mock("../../../lib/uploaderI18n.client", () => ({
  useUploaderI18n: () => ({ t: (key: string) => key }),
}));

jest.mock("../catalogWorkflow", () => ({
  getCatalogDraftWorkflowReadiness: () => ({
    isDataReady: true,
    isSubmissionReady: false,
    isPublishReady: false,
    hasImages: false,
    missingFieldPaths: [],
    missingRoles: [],
  }),
}));

jest.mock("../CatalogProductBaseFields.client", () => ({
  CatalogProductBaseFields: (props: unknown) => catalogProductBaseFieldsMock(props),
}));

jest.mock("../CatalogProductClothingFields.client", () => ({
  CatalogProductClothingFields: () => <div data-cy="clothing-fields" />,
}));

jest.mock("../CatalogProductJewelryFields.client", () => ({
  CatalogProductJewelryFields: () => <div data-cy="jewelry-fields" />,
}));

jest.mock("../CatalogProductImagesFields.client", () => {
  const React = require("react");
  return {
    CatalogProductImagesFields: () =>
      React.createElement("div", { "data-cy": "images-fields" }),
    ImageDropZone: ({ testId }: { testId?: string }) =>
      React.createElement("div", { "data-testid": testId ?? "image-drop-zone" }),
    MainImagePanel: () => React.createElement("div", { "data-cy": "main-image-panel" }),
    AdditionalImagesPanel: () =>
      React.createElement("div", { "data-cy": "additional-images-panel" }),
    useImageUploadController: () => ({
      fileInputRef: { current: null },
      fileInputRef2: { current: null },
      previews: new Map(),
      dragOver: false,
      dragOver2: false,
      uploadStatus: "idle",
      uploadError: "",
      pendingPreviewUrl: null,
      canUpload: false,
      isUploading: false,
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDrop: jest.fn(),
      handleFileInput: jest.fn(),
      handleDragOver2: jest.fn(),
      handleDragLeave2: jest.fn(),
      handleDrop2: jest.fn(),
      handleFileInput2: jest.fn(),
      handleRemoveImage: jest.fn(),
      handleMakeMainImage: jest.fn(),
      handleReorderImage: jest.fn(),
    }),
    parseImageEntries: (_files: string) => [],
  };
});

const VALID_DRAFT: CatalogProductDraftInput = {
  id: "p1",
  slug: "studio-jacket",
  title: "Studio jacket",
  brandHandle: "atelier-x",
  collectionHandle: "outerwear",
  collectionTitle: "Outerwear",
  price: "189.00",
  description: "A structured layer.",
  createdAt: "2025-12-01T12:00:00.000Z",
  popularity: "0",
  sizes: "S|M|L",
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "outerwear",
    color: "black",
    material: "wool",
  },
};

type RenderOverrides = {
  selectedSlug?: string | null;
  busy?: boolean;
  autosaveStatus?: "saving" | "saved" | "unsaved";
  onSaveResult?: { status: "saved"; product: CatalogProductDraftInput; revision: string | null } | { status: "error" };
  draft?: CatalogProductDraftInput;
  onPublish?: ReturnType<typeof jest.fn>;
};

function renderForm(overrides?: RenderOverrides) {
  const onSave = jest.fn(async () => overrides?.onSaveResult ?? ({ status: "saved", product: VALID_DRAFT, revision: null } as const));
  const onDelete = jest.fn();
  const onSaveWithDraft = jest.fn();
  const onChangeDraft = jest.fn();
  const onSavedFeedback = jest.fn();
  const onPublish = overrides?.onPublish ?? jest.fn(async () => ({ status: "published" } as const));
  render(
    <CatalogProductForm
      selectedSlug={overrides?.selectedSlug ?? null}
      draft={overrides?.draft ?? VALID_DRAFT}
      storefront="xa-b"
      fieldErrors={{}}
      busy={Boolean(overrides?.busy)}
      autosaveInlineMessage={null}
      autosaveStatus={overrides?.autosaveStatus ?? "unsaved"}
      lastAutosaveSavedAt={null}
      feedback={null}
      onChangeDraft={onChangeDraft}
      onSave={onSave}
      onSavedFeedback={onSavedFeedback}
      onSaveWithDraft={onSaveWithDraft}
      onDelete={onDelete}
      onPublish={onPublish}
    />,
  );
  return { onSave, onDelete, onSavedFeedback, onPublish };
}

describe("CatalogProductForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("renders Save as draft in product step for add flow", async () => {
    const add = renderForm({ selectedSlug: null });
    expect(screen.queryByRole("button", { name: "delete" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("catalog-save-details"));
    await waitFor(() => {
      expect(add.onSave).toHaveBeenCalledTimes(1);
    });
  });

  it("renders Save as draft in product step for edit flow", async () => {
    const edit = renderForm({ selectedSlug: "studio-jacket" });
    expect(screen.getByRole("button", { name: "delete" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("catalog-save-details"));
    await waitFor(() => {
      expect(edit.onSave).toHaveBeenCalledTimes(1);
    });
  });

  it("renders main image panel, base fields, and additional images panel simultaneously without tab interaction", () => {
    renderForm();

    expect(document.querySelector('[data-cy="main-image-panel"]')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="base-fields"]')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="additional-images-panel"]')).toBeInTheDocument();
  });

  it("does not render the commercial/derived description section", () => {
    renderForm();

    const firstCallProps = catalogProductBaseFieldsMock.mock.calls[0]?.[0] as {
      sections?: string[];
    };
    expect(firstCallProps.sections).toEqual(["identity"]);
  });
});

describe("CatalogProductForm — Make Live button (TASK-03)", () => {
  const catalogWorkflowModule = require("../catalogWorkflow");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: Make Live button renders when isPublishReady is true", () => {
    jest.spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness").mockReturnValue({
      isDataReady: true,
      isPublishReady: true,
      hasImages: true,
      missingFieldPaths: [],
      missingRoles: [],
    });
    renderForm();
    expect(screen.getByTestId("catalog-make-live")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-make-live")).toHaveTextContent("makeLive");
  });

  it("TC-02: Make Live button is absent when isPublishReady is false", () => {
    jest.spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness").mockReturnValue({
      isDataReady: true,
      isPublishReady: false,
      hasImages: false,
      missingFieldPaths: [],
      missingRoles: [],
    });
    render(
      <CatalogProductForm
        selectedSlug={null}
        draft={VALID_DRAFT}
        storefront="xa-b"
        fieldErrors={{}}
        busy={false}
        autosaveInlineMessage={null}
        autosaveStatus="unsaved"
        lastAutosaveSavedAt={null}
        feedback={null}
        onChangeDraft={jest.fn()}
        onSave={jest.fn(async () => ({ status: "saved", product: VALID_DRAFT, revision: null } as const))}
        onSaveWithDraft={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("catalog-make-live")).not.toBeInTheDocument();
  });

  it("TC-03: onPublish called when Make Live button is clicked", async () => {
    jest.spyOn(catalogWorkflowModule, "getCatalogDraftWorkflowReadiness").mockReturnValue({
      isDataReady: true,
      isPublishReady: true,
      hasImages: true,
      missingFieldPaths: [],
      missingRoles: [],
    });
    const onPublish = jest.fn(async () => ({ status: "published" } as const));
    renderForm({ onPublish });
    fireEvent.click(screen.getByTestId("catalog-make-live"));
    await waitFor(() => {
      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(onPublish).toHaveBeenCalledWith("live");
    });
  });

  it("shows progress and completion states for Make Live", async () => {
    jest.useFakeTimers();
    const onPublish = jest.fn(
      async () => new Promise((resolve) => window.setTimeout(() => resolve({ status: "published" }), 10)),
    );
    renderForm({ onPublish });

    fireEvent.click(screen.getByTestId("catalog-make-live"));
    expect(screen.getByTestId("catalog-make-live")).toHaveTextContent("makeLiveRunning");

    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    await waitFor(() => {
      expect(screen.getByTestId("catalog-make-live")).toHaveTextContent("makeLiveComplete");
    });

    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    await waitFor(() => {
      expect(screen.getByTestId("catalog-make-live")).toHaveTextContent("makeLive");
    });
  });

  it("shows Out of stock for live products and publishes out_of_stock when clicked", async () => {
    const onPublish = jest.fn(async () => ({ status: "published" } as const));
    renderForm({
      selectedSlug: "studio-jacket",
      draft: { ...VALID_DRAFT, publishState: "live" },
      onPublish,
    });

    fireEvent.click(screen.getByRole("button", { name: "statusOutOfStock" }));
    await waitFor(() => {
      expect(onPublish).toHaveBeenCalledWith("out_of_stock");
    });
  });
});

describe("CatalogProductForm — zone 2 visibility", () => {
  const imagesFieldsModule = jest.requireMock<{
    useImageUploadController: () => Record<string, unknown>;
  }>("../CatalogProductImagesFields.client");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-A: zone 2 absent when no images (imageFiles empty)", () => {
    renderForm({ draft: { ...VALID_DRAFT, imageFiles: "" } });
    expect(document.querySelector('[data-testid="image-drop-zone-additional"]')).not.toBeInTheDocument();
  });

  it("TC-B: zone 2 present when at least one image exists", () => {
    renderForm({ draft: { ...VALID_DRAFT, imageFiles: "images/studio-jacket/a.jpg" } });
    expect(document.querySelector('[data-testid="image-drop-zone-additional"]')).toBeInTheDocument();
  });

  it("TC-C: error message appears near zone 2 when upload fails", () => {
    const original = imagesFieldsModule.useImageUploadController;
    imagesFieldsModule.useImageUploadController = () => ({
      fileInputRef: { current: null },
      fileInputRef2: { current: null },
      previews: new Map(),
      dragOver: false,
      dragOver2: false,
      uploadStatus: "error",
      uploadError: "Image upload failed.",
      pendingPreviewUrl: null,
      canUpload: true,
      isUploading: false,
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDrop: jest.fn(),
      handleFileInput: jest.fn(),
      handleDragOver2: jest.fn(),
      handleDragLeave2: jest.fn(),
      handleDrop2: jest.fn(),
      handleFileInput2: jest.fn(),
      handleRemoveImage: jest.fn(),
      handleMakeMainImage: jest.fn(),
      handleReorderImage: jest.fn(),
    });
    renderForm({ draft: { ...VALID_DRAFT, imageFiles: "images/studio-jacket/a.jpg" } });
    expect(screen.getAllByText("Image upload failed.").length).toBeGreaterThanOrEqual(2);
    imagesFieldsModule.useImageUploadController = original;
  });
});
