import { render, screen } from "@testing-library/react";
import PagesTable from "../PagesTable.client";
import type { Page } from "@acme/types";

describe("PagesTable", () => {
  const shop = "demo";
  const pages: Page[] = [
    {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" } },
      createdAt: "2023-01-01",
      updatedAt: "2023-01-01",
      createdBy: "admin",
    },
    {
      id: "2",
      slug: "about",
      status: "published",
      components: [],
      seo: { title: { en: "About" } },
      createdAt: "2023-01-02",
      updatedAt: "2023-01-02",
      createdBy: "admin",
    },
  ];

  it("renders only slug and status columns when read-only", () => {
    render(<PagesTable shop={shop} pages={pages} canWrite={false} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent?.trim());
    expect(headers).toEqual(["Slug", "Status"]);
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "New Page" })
    ).not.toBeInTheDocument();
  });

  it("shows new page and edit links when writable", () => {
    render(<PagesTable shop={shop} pages={pages} canWrite />);

    const newPageLink = screen.getByRole("link", { name: "New Page" });
    expect(newPageLink).toHaveAttribute(
      "href",
      `/cms/shop/${shop}/pages/new/builder`
    );

    const editLinks = screen.getAllByRole("link", { name: "Edit" });
    expect(editLinks).toHaveLength(pages.length);
    pages.forEach((p, idx) => {
      expect(editLinks[idx]).toHaveAttribute(
        "href",
        `/cms/shop/${shop}/pages/${p.slug}/builder`
      );
    });
  });
});

