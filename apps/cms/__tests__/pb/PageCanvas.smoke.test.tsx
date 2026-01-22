import React from "react";
import { render, screen } from "@testing-library/react";

// Target under test (UI package source)
import PageCanvas from "@acme/cms-ui/page-builder/PageCanvas";
import type { Locale } from "@acme/i18n/locales";

// Stub heavy editable canvas subtree to avoid deep dependencies while
// still executing PageCanvas branching and prop plumbing.
// Resolve absolute module path so relative imports from UI resolve to the same.
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/EditableCanvas"), () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-cy="editable-canvas-stub">
      editable
      <pre>{JSON.stringify({
        components: props.components?.length,
        selectedIds: props.selectedIds,
        gridCols: props.gridCols,
        viewport: props.viewport,
      })}</pre>
    </div>
  ),
}));

// Also stub PreviewCanvas to keep render minimal
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/PreviewCanvas"), () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-cy="preview-canvas-stub">
      preview
      <pre>{JSON.stringify({
        components: props.components?.length,
        viewport: props.viewport,
      })}</pre>
    </div>
  ),
}));

const baseProps = {
  components: [],
  locale: "en" as Locale,
  containerStyle: { width: 1000 },
  viewport: "desktop" as const,
};

describe("PageCanvas (smoke)", () => {
  it("renders PreviewCanvas when preview=true", () => {
    render(<PageCanvas {...baseProps} preview />);
    expect(screen.getByTestId("preview-canvas-stub")).toBeInTheDocument();
  });

  it("renders EditableCanvas when preview=false (default)", () => {
    render(
      <PageCanvas
        {...baseProps}
        components={[{ id: "c1", type: "Text" } as any]}
        gridCols={12}
      />
    );
    expect(screen.getByTestId("editable-canvas-stub")).toBeInTheDocument();
  });
});
