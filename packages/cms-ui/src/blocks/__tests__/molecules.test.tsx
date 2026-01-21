import { render, screen } from "@testing-library/react";

import { CategoryList,NewsletterForm, PromoBanner } from "../molecules";

const mockCategoryCollectionTemplate = jest.fn((_props: unknown) => null);

jest.mock("../../../templates/CategoryCollectionTemplate", () => ({
  __esModule: true,
  CategoryCollectionTemplate: (props: unknown) => mockCategoryCollectionTemplate(props),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("NewsletterForm", () => {
  it("resolves locale-specific placeholder and submit label", () => {
    render(
      <NewsletterForm
        placeholder={{ en: "Email", de: "E-Mail", it: "E-mail" }}
        submitLabel={{ en: "Join", de: "Beitreten", it: "Iscriviti" }}
        locale="de"
      />
    );
    expect(screen.getByPlaceholderText("E-Mail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beitreten" })).toBeInTheDocument();
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
        text={{ en: "Hi", de: "Hallo", it: "Ciao" }}
        buttonLabel={{ en: "Shop", de: "Einkaufen", it: "Acquista" }}
        href="/de"
        locale="de"
      />
    );
    expect(screen.getByText("Hallo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Einkaufen" })
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
    expect((mockCategoryCollectionTemplate.mock.calls[0] as unknown[])[0]).toMatchObject({
      categories,
      columns: 4,
    });
  });
});
