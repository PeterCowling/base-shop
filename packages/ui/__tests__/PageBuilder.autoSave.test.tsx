import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

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

import PageBuilder from "../src/components/cms/PageBuilder";

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

    render(<PageBuilder page={page} onSave={onSave} onPublish={onPublish} />);

    const spacer = await screen.findByText("Spacer");
    fireEvent.keyDown(spacer, { key: "Enter" });
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
