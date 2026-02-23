import "@testing-library/jest-dom";

import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SeoEditor from "../src/app/cms/shop/[shop]/settings/seo/SeoEditor";

const setFreezeTranslationsMock = jest.fn();
const updateSeoMock = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  setFreezeTranslations: (...args: unknown[]) => setFreezeTranslationsMock(...args),
}));

jest.mock("@cms/actions/shops-seo.server", () => ({
  updateSeo: (...args: unknown[]) => updateSeoMock(...args),
}));

jest.mock("@acme/ui/operations", () => ({
  useToast: () => ({
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  }),
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
        languages={["en", "de"]}
        initialSeo={{
          en: { title: "Hello", description: "Desc EN", canonicalBase: "en.com" },
          de: { title: "Hallo", description: "Desc DE", canonicalBase: "de.com" },
        }}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Hello");

    await user.click(screen.getByRole("tab", { name: "DE" }));

    expect(screen.getByLabelText("Title")).toHaveValue("Hallo");
    expect(screen.getByLabelText("Description")).toHaveValue("Desc DE");
  });

  it("keeps fields when switching locale with freeze enabled", async () => {
    const user = userEvent.setup();
    render(
      <SeoEditor
        shop="s1"
        languages={["en", "de"]}
        initialSeo={{
          en: { title: "Hello", description: "Desc EN", canonicalBase: "en.com" },
          de: { title: "Hallo", description: "Desc DE", canonicalBase: "de.com" },
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

    await user.click(screen.getByRole("tab", { name: "DE" }));

    expect(titleInput).toHaveValue("Custom");
  });

  it("generates metadata", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: "Gen title",
        description: "Gen description",
        image: "img.png",
      }),
    });
    updateSeoMock.mockResolvedValueOnce({});

    render(
      <SeoEditor shop="s1" languages={["en"]} initialSeo={{ en: {} }} />,
    );

    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/seo/generate",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() =>
      expect(updateSeoMock).toHaveBeenCalledWith("s1", expect.any(FormData)),
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Title")).toHaveValue("Gen title");
      expect(screen.getByLabelText("Description")).toHaveValue("Gen description");
      expect(screen.getByLabelText("Image URL")).toHaveValue("img.png");
      // `alt` is intentionally not set by `generate()`; it remains user-authored.
      expect(screen.getByLabelText("Image Alt Text")).toHaveValue("");
    });
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
    expect(
      await screen.findByText("Check alt text", { selector: "li" }),
    ).toBeInTheDocument();
  });
});
