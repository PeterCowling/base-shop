import { render, waitFor } from "@testing-library/react";
import PageBuilder from "../../packages/ui/src/components/cms/PageBuilder";
import type { Page, HistoryState, PageComponent } from "../../packages/types/src/Page";

describe("PageBuilder history", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes from provided history on reload", async () => {
    const present: PageComponent[] = [
      { id: "b", type: "Text" },
    ];
    const history: HistoryState = {
      past: [[{ id: "a", type: "Text" }]],
      present,
      future: [],
    };

    const page: Page = {
      id: "p1",
      slug: "home",
      status: "draft",
      components: [{ id: "c", type: "Text" }],
      history,
      seo: {
        title: { en: "", de: "", it: "" },
        description: { en: "", de: "", it: "" },
        image: { en: "", de: "", it: "" },
      },
      createdAt: "",
      updatedAt: "",
      createdBy: "tester",
    };

    const onChange = jest.fn();

    render(
      <PageBuilder
        page={page}
        history={page.history}
        onSave={async () => undefined}
        onPublish={async () => undefined}
        onChange={onChange}
      />
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0]).toEqual(present);
  });
});

