import {
  fireEvent,
  renderThemeEditor,
  screen,
  waitFor,
  mockSavePreset,
  mockDeletePreset,
  act,
} from "./ThemeEditor.test-utils";
import { PREVIEW_TOKENS_KEY } from "../src/app/cms/wizard/previewTokens";

describe("ThemeEditor - presets", () => {
  beforeEach(() => {
    mockSavePreset.mockClear();
    mockDeletePreset.mockClear();
    localStorage.clear();
  });

  it("saves a new preset and switches theme", async () => {
    const tokensByTheme = { base: { "--color-bg": "#ffffff" } };
    mockSavePreset.mockResolvedValue({});
    renderThemeEditor({
      tokensByTheme,
      initialOverrides: { "--color-bg": "#000000" },
    });

    fireEvent.change(screen.getByPlaceholderText(/preset name/i), {
      target: { value: "custom" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save preset/i }));
    });

    await waitFor(() => expect(mockSavePreset).toHaveBeenCalled());
    expect(mockSavePreset).toHaveBeenCalledWith("test", "custom", {
      "--color-bg": "#000000",
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/theme/i)).toHaveValue("custom")
    );
  });

  it("deletes a preset and reverts to base theme", async () => {
    const tokensByTheme = {
      base: { "--color-bg": "#ffffff" },
      custom: { "--color-bg": "#000000" },
    };
    mockDeletePreset.mockResolvedValue({});
    renderThemeEditor({
      tokensByTheme,
      themes: ["base", "custom"],
      initialTheme: "custom",
      presets: ["custom"],
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /delete preset/i }));
    });

    await waitFor(() => expect(mockDeletePreset).toHaveBeenCalled());
    expect(mockDeletePreset).toHaveBeenCalledWith("test", "custom");
    await waitFor(() =>
      expect(screen.getByLabelText(/theme/i)).toHaveValue("base")
    );
    expect(screen.queryByRole("button", { name: /delete preset/i })).toBeNull();
  });

  it("updates preview tokens when switching themes", async () => {
    const tokensByTheme = {
      base: { "--color-bg": "#ffffff" },
      dark: { "--color-bg": "#222222" },
    };
    renderThemeEditor({ tokensByTheme, themes: ["base", "dark"] });

    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(PREVIEW_TOKENS_KEY) || "{}")[
          "--color-bg"
        ],
      ).toBe("#ffffff"),
    );

    fireEvent.change(screen.getByLabelText(/theme/i), {
      target: { value: "dark" },
    });

    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(PREVIEW_TOKENS_KEY) || "{}")[
          "--color-bg"
        ],
      ).toBe("#222222"),
    );
  });
});
