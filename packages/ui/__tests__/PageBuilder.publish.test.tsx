import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/shop",
}));

import PageBuilder from "../src/components/cms/PageBuilder";

describe("PageBuilder publishing", () => {
  const page = {
    id: "p1",
    updatedAt: "2024-01-01",
    slug: "slug",
    status: "draft",
    seo: { title: { en: "" }, description: {} },
    components: [],
  } as any;

  it("clears history from localStorage after publishing", async () => {
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const onSave = jest.fn().mockResolvedValue(undefined);
    const storageKey = `page-builder-history-${page.id}`;
    localStorage.setItem(storageKey, "history");

    render(<PageBuilder page={page} onSave={onSave} onPublish={onPublish} />);

    expect(localStorage.getItem(storageKey)).not.toBeNull();

    // Query by accessible name to avoid brittle DOM structure assumptions
    const publishButton = screen.getByRole("button", { name: "Publish" });
    fireEvent.click(publishButton);

    await waitFor(() => expect(localStorage.getItem(storageKey)).toBeNull());
    expect(onPublish).toHaveBeenCalled();
  });
});
