import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SeoForm from "../src/app/cms/shop/[shop]/settings/seo/SeoForm.client";
import { updateSeo } from "@cms/actions/shops.server";

jest.mock("@cms/actions/shops.server", () => ({
  updateSeo: jest.fn(),
}));

jest.mock(
  "@/components/atoms",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Alert: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
      Tooltip: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
      ),
    };
  },
  { virtual: true },
);

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Button: ({ children, ...props }: any) => (
        <button {...props}>{children}</button>
      ),
      Input: (props: any) => <input {...props} />,
      Textarea: (props: any) => <textarea {...props} />,
    };
  },
  { virtual: true },
);

beforeEach(() => {
  (updateSeo as jest.Mock).mockReset();
});

describe("SeoForm", () => {
  it("switches language tabs and updates fields", async () => {
    const user = userEvent.setup();
    render(
      <SeoForm shop="shop" languages={["en", "fr"]} initialSeo={{}} />,
    );

    const enTitle = screen.getAllByLabelText(/title/i)[0] as HTMLInputElement;
    await user.type(enTitle, "Hello EN");
    expect(enTitle).toHaveValue("Hello EN");

    await user.click(screen.getByRole("button", { name: "FR" }));
    const frTitle = screen.getAllByLabelText(/title/i)[0] as HTMLInputElement;
    expect(frTitle).toHaveValue("");
    await user.type(frTitle, "Bonjour FR");
    expect(frTitle).toHaveValue("Bonjour FR");

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getAllByLabelText(/title/i)[0]).toHaveValue("Hello EN");
  });

  it("submits form and shows warnings", async () => {
    const user = userEvent.setup();
    (updateSeo as jest.Mock).mockResolvedValue({
      warnings: ["Title exceeds 70 characters"],
    });

    render(
      <SeoForm shop="shop" languages={["en", "fr"]} initialSeo={{}} />,
    );

    const titleInput = screen.getAllByLabelText(/title/i)[0] as HTMLInputElement;
    const descInput = screen.getAllByLabelText(/description/i)[0] as HTMLTextAreaElement;
    await user.type(titleInput, "Some title");
    await user.type(descInput, "Some description");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateSeo).toHaveBeenCalledTimes(1);
    const [shopArg, formData] = (updateSeo as jest.Mock).mock.calls[0];
    expect(shopArg).toBe("shop");
    const entries = Object.fromEntries((formData as FormData).entries());
    expect(entries).toEqual({
      locale: "en",
      title: "Some title",
      description: "Some description",
      image: "",
      brand: "",
      offers: "",
      aggregateRating: "",
      structuredData: "",
    });

    expect(
      await screen.findByText("Title exceeds 70 characters"),
    ).toBeInTheDocument();
  });

  it("shows errors from updateSeo", async () => {
    const user = userEvent.setup();
    (updateSeo as jest.Mock).mockResolvedValue({
      errors: { title: ["Required"] },
    });

    render(<SeoForm shop="shop" languages={["en", "fr"]} initialSeo={{}} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Required")).toBeInTheDocument();
  });
});
