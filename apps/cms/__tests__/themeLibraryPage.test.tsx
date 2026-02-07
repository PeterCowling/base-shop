import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import ThemeLibraryPage from "../src/app/cms/themes/library/page";

const track = jest.fn();
const useTranslations = jest.fn();
const translations = {
  "cms.theme.library": "Mock Theme Library",
  "cms.back": "Mock Back Link",
};

const translator = (key: string) => (translations as Record<string, string>)[key] ?? key;

jest.mock("@acme/telemetry", () => ({
  track,
}));

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: any; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ThemeLibraryPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
    useTranslations.mockResolvedValue(translator);
  });

  afterEach(() => {
    const fetchMock = global.fetch as jest.Mock | undefined;
    if (typeof fetchMock?.mockReset === "function") {
      fetchMock.mockReset();
    }
    global.fetch = originalFetch;
  });

  it("tracks the view and renders fetched themes", async () => {
    const sampleThemes = [
      { id: "theme-1", name: "First Theme" },
      { id: "theme-2", name: "Second Theme" },
    ];
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => sampleThemes,
    });

    render(await ThemeLibraryPage());

    expect(track).toHaveBeenCalledWith("themes:library:view", {});
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/themes"), {
      cache: "no-store",
    });
    expect(
      screen.getByRole("heading", { level: 2, name: translations["cms.theme.library"] })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: translations["cms.back"] })).toHaveAttribute(
      "href",
      "/cms"
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(sampleThemes.length);
    sampleThemes.forEach((theme) => {
      expect(screen.getByText(theme.name)).toBeInTheDocument();
    });
  });

  it("tracks the view and handles fetch failure", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({ ok: false });

    render(await ThemeLibraryPage());

    expect(track).toHaveBeenCalledWith("themes:library:view", {});
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/themes"), {
      cache: "no-store",
    });
    expect(
      screen.getByRole("heading", { level: 2, name: translations["cms.theme.library"] })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: translations["cms.back"] })).toHaveAttribute(
      "href",
      "/cms"
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
