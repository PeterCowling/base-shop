import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { TemplateDescriptor } from "@acme/page-builder-core";
import type { Page } from "@acme/types";

import TemplateActions from "../TemplateActions";

const track = jest.fn();

jest.mock("@acme/telemetry", () => ({
  __esModule: true,
  track: (...args: unknown[]) => track(...args),
}));

jest.mock("next/image", () => {
  const React = require("react");
  const MockImage = ({ alt, ...props }: any) => <img alt={alt} {...props} />;
  MockImage.displayName = "MockImage";
  return { __esModule: true, default: MockImage };
});

describe("TemplateActions telemetry", () => {
  const template: TemplateDescriptor = {
    id: "tpl-1",
    version: "1.0.0",
    kind: "page",
    label: "Tpl One",
    description: "Test template",
    category: "Commerce",
    pageType: "marketing",
    previewImage: "/templates/home-default.svg",
    components: [{ id: "c1", type: "Section" } as any],
    origin: "core",
  };

  const currentPage: Page = {
    id: "page-1",
    slug: "page-1",
    status: "draft",
    components: [],
    seo: { title: {}, description: {}, image: {} },
    createdAt: "",
    updatedAt: "",
    createdBy: "",
  };

  beforeEach(() => {
    track.mockClear();
  });

  it("fires telemetry on open, select, and apply", async () => {
    const onApply = jest.fn().mockResolvedValue(undefined);
    render(
      <TemplateActions
        templates={[template]}
        currentPage={currentPage}
        buildTemplatePage={() => ({
          ...currentPage,
          components: [{ id: "next", type: "Section" } as any],
        })}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByText("Create from template"));

    await waitFor(() =>
      expect(track).toHaveBeenCalledWith(
        "pb_template_gallery_open",
        expect.objectContaining({ surface: "page-builder", pageId: "page-1" }),
      ),
    );

    fireEvent.click(screen.getByTestId("template-tpl-1"));
    expect(track).toHaveBeenCalledWith(
      "pb_template_select",
      expect.objectContaining({ templateId: "tpl-1", pageId: "page-1" }),
    );

    fireEvent.click(screen.getByText("Apply template"));
    await waitFor(() =>
      expect(track).toHaveBeenCalledWith(
        "pb_template_apply",
        expect.objectContaining({ templateId: "tpl-1", pageId: "page-1" }),
      ),
    );
    expect(onApply).toHaveBeenCalled();
  });
});
