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

jest.mock("../CatalogProductImagesFields.client", () => ({
  CatalogProductImagesFields: () => <div data-cy="images-fields" />,
}));

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
};

function renderForm(overrides?: RenderOverrides) {
  const onSave = jest.fn(async () => overrides?.onSaveResult ?? ({ status: "saved", product: VALID_DRAFT, revision: null } as const));
  const onDelete = jest.fn();
  const onSaveWithDraft = jest.fn();
  const onChangeDraft = jest.fn();
  const onSavedFeedback = jest.fn();
  render(
    <CatalogProductForm
      selectedSlug={overrides?.selectedSlug ?? null}
      draft={VALID_DRAFT}
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
    />,
  );
  return { onSave, onDelete, onSavedFeedback };
}

function renderFormWithFeedback(overrides?: RenderOverrides) {
  const onSave = jest.fn(async () => overrides?.onSaveResult ?? ({ status: "saved", product: VALID_DRAFT, revision: null } as const));
  const onDelete = jest.fn();
  const onSaveWithDraft = jest.fn();
  const onChangeDraft = jest.fn();

  function Harness() {
    const [feedback, setFeedback] = React.useState<ActionFeedback | null>(null);

    return (
      <CatalogProductForm
        selectedSlug={overrides?.selectedSlug ?? null}
        draft={VALID_DRAFT}
        storefront="xa-b"
        fieldErrors={{}}
        busy={Boolean(overrides?.busy)}
        autosaveInlineMessage={null}
        autosaveStatus={overrides?.autosaveStatus ?? "unsaved"}
        lastAutosaveSavedAt={null}
        feedback={feedback}
        onChangeDraft={onChangeDraft}
        onSave={onSave}
        onSavedFeedback={() =>
          setFeedback({
            kind: "success",
            message: "saveAndAdvanceFeedback",
          })
        }
        onSaveWithDraft={onSaveWithDraft}
        onDelete={onDelete}
      />
    );
  }

  render(<Harness />);
  return { onSave, onDelete };
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

  it("keeps save action scoped to product step only", () => {
    renderForm();
    expect(screen.getByTestId("catalog-save-details")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /workflowStepImages/ }));

    expect(screen.queryByTestId("catalog-save-details")).not.toBeInTheDocument();
    expect(screen.getByTestId("images-fields")).toBeInTheDocument();
  });

  it("does not render the commercial/derived description section", () => {
    renderForm();

    const firstCallProps = catalogProductBaseFieldsMock.mock.calls[0]?.[0] as {
      sections?: string[];
    };
    expect(firstCallProps.sections).toEqual(["identity", "taxonomy"]);
  });

  it("shows saved state for 2 seconds then auto-advances to images", async () => {
    jest.useFakeTimers();
    renderForm();
    fireEvent.click(screen.getByTestId("catalog-save-details"));

    await waitFor(() => {
      expect(screen.getByTestId("catalog-save-details")).toHaveTextContent("saveButtonSaved");
    });
    expect(screen.queryByTestId("images-fields")).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("images-fields")).toBeInTheDocument();
    });
  });

  it("shows save-and-advance feedback when the transition timer fires", async () => {
    jest.useFakeTimers();
    renderFormWithFeedback();
    fireEvent.click(screen.getByTestId("catalog-save-details"));

    await waitFor(() => {
      expect(screen.getByTestId("catalog-save-details")).toHaveTextContent("saveButtonSaved");
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("catalog-draft-feedback")).toHaveTextContent(
        "saveAndAdvanceFeedback",
      );
    });
  });

  it("cancels save auto-advance when delete is clicked during saved state", async () => {
    jest.useFakeTimers();
    const edit = renderForm({ selectedSlug: "studio-jacket" });
    fireEvent.click(screen.getByTestId("catalog-save-details"));

    await waitFor(() => {
      expect(screen.getByTestId("catalog-save-details")).toHaveTextContent("saveButtonSaved");
    });

    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(edit.onDelete).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("images-fields")).not.toBeInTheDocument();
    });
  });
});
