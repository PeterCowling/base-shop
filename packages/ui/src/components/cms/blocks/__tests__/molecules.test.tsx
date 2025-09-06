import { render, screen } from "@testing-library/react";

const mockCategoryCollectionTemplate = jest.fn(() => null);

jest.mock("../../../templates/CategoryCollectionTemplate", () => ({
  __esModule: true,
  CategoryCollectionTemplate: (props: any) => mockCategoryCollectionTemplate(props),
}));

import { NewsletterForm, PromoBanner, CategoryList } from "../molecules";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("NewsletterForm", () => {
  it("resolves locale-specific placeholder and submit label", () => {
    render(
      <NewsletterForm
        placeholder={{ en: "Email", fr: "Courriel" }}
        submitLabel={{ en: "Join", fr: "Adhérer" }}
        locale="fr"
      />
    );
    expect(screen.getByPlaceholderText("Courriel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adhérer" })).toBeInTheDocument();
  });

  it("uses provided action and method", () => {
    const { container } = render(
      <NewsletterForm action="/subscribe" method="get" />
    );
    const form = container.querySelector("form");
    expect(form).toHaveAttribute("action", "/subscribe");
    expect(form).toHaveAttribute("method", "get");
  });
});

describe("PromoBanner", () => {
  it("renders button only when href present", () => {
    const { queryByRole, rerender, getByRole } = render(
      <PromoBanner text="Sale now" />
    );
    expect(queryByRole("link")).toBeNull();
    rerender(<PromoBanner text="Sale now" href="/sale" buttonLabel="Shop" />);
    expect(getByRole("link", { name: "Shop" })).toHaveAttribute(
      "href",
      "/sale"
    );
  });

  it("resolves locale text and button label", () => {
    render(
      <PromoBanner
        text={{ en: "Hi", fr: "Bonjour" }}
        buttonLabel={{ en: "Shop", fr: "Acheter" }}
        href="/fr"
        locale="fr"
      />
    );
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Acheter" })
    ).toBeInTheDocument();
  });
});

describe("CategoryList", () => {
  it("returns null when categories empty", () => {
    const { container } = render(<CategoryList categories={[]} />);
    expect(container.firstChild).toBeNull();
    expect(mockCategoryCollectionTemplate).not.toHaveBeenCalled();
  });

  it("passes columns to CategoryCollectionTemplate", () => {
    const categories = [{ id: "1", title: "Cat", image: "/a.jpg" }];
    render(<CategoryList categories={categories} columns={4} />);
    expect(mockCategoryCollectionTemplate).toHaveBeenCalledTimes(1);
    expect(mockCategoryCollectionTemplate.mock.calls[0][0]).toMatchObject({
      categories,
      columns: 4,
    });
  });
});
