import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SearchBar from "../SearchBar";

describe("SearchBar", () => {
  it("fetches and displays results", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "1", title: "Apple", image: "", price: 1 }],
    });
    // @ts-ignore
    global.fetch = mockFetch;

    render(<SearchBar placeholder="Search" limit={5} />);
    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "App" } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/products?q=App&limit=5",
      expect.any(Object)
    );
    expect(await screen.findByText("Apple")).toBeInTheDocument();
  });
});

