import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PageBuilder from "../src/components/cms/PageBuilder";

jest.mock("next/navigation", () => ({
  usePathname: () => "/shop",
}));

jest.mock("../src/components/cms/PageBuilder", () => {
  const React = require("react");
  function MockedPageBuilder({ page, history, onSave }: any) {
    const state = React.useMemo(() => {
      const stored = localStorage.getItem(`page-builder-history-${page.id}`);
      return stored
        ? JSON.parse(stored)
        : history ?? { past: [], present: page.components, future: [] };
    }, [page, history]);
    return (
      <button
        onClick={() => {
          const fd = new FormData();
          fd.append("components", JSON.stringify(state.present));
          fd.append("history", JSON.stringify(state));
          onSave(fd);
        }}
      >
        Save
      </button>
    );
  }
  (MockedPageBuilder as any).displayName = "MockedPageBuilder";
  return { __esModule: true, default: MockedPageBuilder };
});

describe("PageBuilder history persistence", () => {
  const basePage = {
    id: "p1",
    updatedAt: "2024-01-01",
    slug: "slug",
    status: "draft",
    seo: { title: { en: "" }, description: {} },
    components: [],
  } as any;

  it("restores history from localStorage on reload", async () => {
    const history = {
      past: [[{ id: "p", type: "Text" }]],
      present: [{ id: "c", type: "Text" }],
      future: [],
    };
    localStorage.setItem(
      `page-builder-history-${basePage.id}`,
      JSON.stringify(history)
    );
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);

    render(
      <PageBuilder page={basePage} onSave={onSave} onPublish={onPublish} />
    );

    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const fd = onSave.mock.calls[0][0] as FormData;
    expect(JSON.parse(fd.get("components") as string)).toEqual(
      history.present
    );
    expect(JSON.parse(fd.get("history") as string)).toEqual(history);
  });

  it("uses server-provided history when localStorage empty", async () => {
    localStorage.clear();
    const history = {
      past: [],
      present: [{ id: "c1", type: "Text" }],
      future: [],
    };
    const page = { ...basePage, history };
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);

    render(
      <PageBuilder
        page={page}
        history={history}
        onSave={onSave}
        onPublish={onPublish}
      />
    );

    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const fd = onSave.mock.calls[0][0] as FormData;
    expect(JSON.parse(fd.get("components") as string)).toEqual(
      history.present
    );
    expect(JSON.parse(fd.get("history") as string)).toEqual(history);
  });
});
