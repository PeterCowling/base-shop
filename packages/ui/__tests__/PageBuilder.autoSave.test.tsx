import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import PageBuilder from "../src/components/cms/PageBuilder";

jest.mock("next/navigation", () => ({
  usePathname: () => "/shop",
}));

const retry = jest.fn();
let errorTriggered = false;
jest.mock("../src/components/cms/page-builder/hooks/useAutoSave", () => ({
  __esModule: true,
  default: ({ onError }: any) => {
    if (!errorTriggered) {
      errorTriggered = true;
      onError?.(retry);
    }
    return { autoSaveState: "error" };
  },
}));

describe("PageBuilder interactions", () => {
  const page = {
    id: "p1",
    updatedAt: "2024-01-01",
    slug: "slug",
    status: "draft",
    seo: { title: { en: "" }, description: {} },
    components: [],
  } as any;

  it("adds components, toggles preview, saves and retries auto-save", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);

    const { container } = render(
      <PageBuilder page={page} onSave={onSave} onPublish={onPublish} />
    );

    const paletteItems = Array.from(
      container.querySelectorAll('div[role="button"][title="Drag or press space/enter to add"]')
    ) as HTMLElement[];
    const sectionItem = paletteItems.find((el) => /\bSection\b/i.test(el.textContent || ""));
    expect(sectionItem).toBeTruthy();
    fireEvent.keyDown(sectionItem as HTMLElement, { key: "Enter" });
    const canvas = screen.getByRole("list");
    await waitFor(() => {
      expect(within(canvas).getAllByRole("listitem")).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Show preview" }));
    expect(
      screen.getByRole("button", { name: "Hide preview" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const toastMsg = await screen.findByText(
      "Auto-save failed. Click to retry."
    );
    fireEvent.click(toastMsg);
    await waitFor(() => expect(retry).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByText("Auto-save failed. Click to retry.")
      ).not.toBeInTheDocument()
    );
  });
});
