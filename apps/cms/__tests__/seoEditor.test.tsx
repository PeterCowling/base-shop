import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SeoEditor from "../src/app/cms/shop/[shop]/settings/seo/SeoEditor";

const setFreezeTranslationsMock = jest.fn();
const updateSeoMock = jest.fn();
const generateSeoMock = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  setFreezeTranslations: (...args: unknown[]) => setFreezeTranslationsMock(...args),
  updateSeo: (...args: unknown[]) => updateSeoMock(...args),
  generateSeo: (...args: unknown[]) => generateSeoMock(...args),
}));

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    return {
      Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      Input: (props: any) => <input {...props} />,
      Textarea: (props: any) => <textarea {...props} />,
      Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    };
  },
  { virtual: true },
);

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).fetch = jest.fn();
});

describe("SeoEditor", () => {
  it("updates fields when switching locale without freeze", async () => {
    const user = userEvent.setup();
    render(
      <SeoEditor
        shop="s1"
        languages={["en", "fr"]}
        initialSeo={{
          en: { title: "Hello", description: "Desc EN", canonicalBase: "en.com" },
          fr: { title: "Bonjour", description: "Desc FR", canonicalBase: "fr.com" },
        }}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Hello");

    await user.click(screen.getByRole("tab", { name: "FR" }));

    expect(screen.getByLabelText("Title")).toHaveValue("Bonjour");
    expect(screen.getByLabelText("Description")).toHaveValue("Desc FR");
  });

  it("keeps fields when switching locale with freeze enabled", async () => {
    const user = userEvent.setup();
    render(
      <SeoEditor
        shop="s1"
        languages={["en", "fr"]}
        initialSeo={{
          en: { title: "Hello", description: "Desc EN", canonicalBase: "en.com" },
          fr: { title: "Bonjour", description: "Desc FR", canonicalBase: "fr.com" },
        }}
      />,
    );

    const freezeCheckbox = screen.getByRole("checkbox", {
      name: /freeze translations/i,
    });
    await user.click(freezeCheckbox);
    expect(setFreezeTranslationsMock).toHaveBeenCalledWith("s1", true);

    const titleInput = screen.getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Custom");

    await user.click(screen.getByRole("tab", { name: "FR" }));

    expect(titleInput).toHaveValue("Custom");

    await user.click(
      screen.getByRole("button", { name: /show advanced settings/i }),
    );
    expect(screen.getByLabelText("Canonical Base")).toHaveValue("fr.com");
  });

  it("generates metadata", async () => {
    const user = userEvent.setup();
    generateSeoMock.mockResolvedValueOnce({
      generated: {
        title: "Gen title",
        description: "Gen description",
        alt: "Gen alt",
        image: "img.png",
      },
    });

    render(
      <SeoEditor shop="s1" languages={["en"]} initialSeo={{ en: {} }} />,
    );

    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    await waitFor(() =>
      expect(generateSeoMock).toHaveBeenCalledWith(
        "s1",
        expect.any(FormData),
      ),
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Gen title");
    expect(screen.getByLabelText("Description")).toHaveValue("Gen description");
    expect(screen.getByLabelText("Image URL")).toHaveValue("img.png");
    expect(screen.getByLabelText("Image Alt Text")).toHaveValue("Gen alt");
  });

  it("shows errors from save", async () => {
    const user = userEvent.setup();
    updateSeoMock.mockResolvedValueOnce({
      errors: { title: ["Too short"] },
    });

    render(
      <SeoEditor shop="s1" languages={["en"]} initialSeo={{ en: {} }} />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateSeoMock).toHaveBeenCalled();
    expect(await screen.findByText("Too short")).toBeInTheDocument();
  });

  it("shows warnings from save", async () => {
    const user = userEvent.setup();
    updateSeoMock.mockResolvedValueOnce({
      warnings: ["Check alt text"],
    });

    render(
      <SeoEditor shop="s1" languages={["en"]} initialSeo={{ en: {} }} />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateSeoMock).toHaveBeenCalled();
    expect(await screen.findByText("Check alt text")).toBeInTheDocument();
  });
});
