import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShopClient from "../../apps/shop-abc/src/app/[lang]/shop/ShopClient.client";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const SKUS = [
  {
    id: "1",
    slug: "red",
    title: "Red Shoe",
    price: 100,
    deposit: 0,
    stock: 1,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["40"],
    description: "",
  },
  {
    id: "2",
    slug: "blue",
    title: "Blue Shoe",
    price: 100,
    deposit: 0,
    stock: 1,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["41"],
    description: "",
  },
];

describe("ShopClient URL persistence", () => {
  beforeEach(() => {
    pushMock.mockReset();
    window.history.replaceState({}, "", "/en/shop");
  });

  it("restores search and filters from URL", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ShopClient skus={SKUS} />);

    await user.type(screen.getByRole("searchbox"), "red");
    await user.selectOptions(screen.getByLabelText(/Size/i), "40");

    await waitFor(() =>
      expect(pushMock).toHaveBeenLastCalledWith("/en/shop?q=red&size=40")
    );

    window.history.pushState({}, "", pushMock.mock.calls.at(-1)[0]);

    unmount();
    render(<ShopClient skus={SKUS} />);

    expect(screen.getByRole("searchbox")).toHaveValue("red");
    expect(screen.getByLabelText(/Size/i)).toHaveValue("40");
  });
});
