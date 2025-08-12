import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchBar from "../src/components/cms/blocks/SearchBar";

describe("SearchBar block", () => {
  it("fetches and displays results", async () => {
    const results = [
      { slug: "a", title: "Alpha" },
      { slug: "b", title: "Beta" },
    ];
    // @ts-expect-error
    global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve(results) });

    render(<SearchBar placeholder="Search products…" />);
    const input = screen.getByPlaceholderText("Search products…");
    fireEvent.change(input, { target: { value: "a" } });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
  });
});
