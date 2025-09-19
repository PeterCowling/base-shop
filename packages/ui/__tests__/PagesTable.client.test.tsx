import { render, screen } from "@testing-library/react";
import PagesTable from "../src/components/cms/PagesTable";
import type { Page } from "@acme/types";

const pages: Page[] = [
  {
    id: "1",
    slug: "about",
    status: "draft",
    components: [],
    seo: { title: { en: "About" } },
    createdAt: "",
    updatedAt: "",
    createdBy: "",
  },
  {
    id: "2",
    slug: "contact",
    status: "published",
    components: [],
    seo: { title: { en: "Contact" } },
    createdAt: "",
    updatedAt: "",
    createdBy: "",
  },
];

describe("PagesTable", () => {
  it("renders columns and rows without actions", () => {
    render(<PagesTable shop="acme" pages={pages} />);

    expect(screen.getByText("Slug")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();

    expect(screen.getByText(/about/)).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();

    expect(screen.queryByText("Create new page")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("shows action buttons when write access is enabled", () => {
    render(<PagesTable shop="acme" pages={pages} canWrite />);

    expect(screen.getByText("Create new page")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    const editLinks = screen.getAllByRole("link", { name: "Edit" });
    expect(editLinks).toHaveLength(pages.length);
  });
});

