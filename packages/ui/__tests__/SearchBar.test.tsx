import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SearchBar from "../src/components/cms/blocks/SearchBar";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: any) => <article>{product.title}</article>,
}));

describe("SearchBar block", () => {
  it("fetches results from API and displays them", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "1", title: "Result", image: "/placeholder.svg", price: 100 },
      ],
    }) as any;

    render(<SearchBar placeholder="Search" limit={5} />);

    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "Res" },
    });

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(await screen.findByText("Result")).toBeInTheDocument();
  });
});

