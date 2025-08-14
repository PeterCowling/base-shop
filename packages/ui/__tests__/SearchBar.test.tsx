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

    const { container } = render(<SearchBar placeholder="Search products…" />);
    const input = screen.getByPlaceholderText("Search products…");
    fireEvent.change(input, { target: { value: "a" } });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const result = await screen.findByText("Alpha");
    expect(result).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "data-token",
      "--color-muted-fg"
    );
    expect(result.parentElement?.parentElement).toHaveAttribute(
      "data-token",
      "--color-bg"
    );
    expect(result.parentElement).toHaveAttribute("data-token", "--color-fg");
  });
});
