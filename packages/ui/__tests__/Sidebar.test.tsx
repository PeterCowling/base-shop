import { render, screen } from "@testing-library/react";
import Sidebar from "../components/cms/Sidebar.client";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from "next/navigation";

const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Sidebar", () => {
  it("shows Shops link and highlights it on /cms/shop", () => {
    mockPathname.mockReturnValue("/cms/shop");

    const { container } = render(<Sidebar />);
    const links = container.querySelectorAll("a");
    expect(links[0]).toHaveTextContent("Dashboard");
    expect(links[1]).toHaveTextContent("Shops");
    expect(links[1].getAttribute("href")).toBe("/cms/shop");
    expect(links[1].getAttribute("aria-current")).toBe("page");
  });

  it("omits Shops link when shop slug is present", () => {
    mockPathname.mockReturnValue("/cms/shop/abc/products");

    render(<Sidebar />);
    expect(screen.queryByText("Shops")).toBeNull();
  });
});
