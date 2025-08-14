import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";
import "../../../../../../test/resetNextMocks";

describe("Header", () => {
  it("renders navigation and handles search suggestions", async () => {
    const nav = [{ title: "Home", href: "/" }];
    render(<Header locale="en" nav={nav} searchSuggestions={["apple"]} />);

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();

    const input = screen.getByRole("searchbox", { name: "Search products" });
    await userEvent.type(input, "app");
    expect(screen.getByText("apple")).toBeInTheDocument();

    await userEvent.click(screen.getByText("apple"));
    await waitFor(() =>
      expect(screen.queryByText("apple")).not.toBeInTheDocument()
    );
  });
});
