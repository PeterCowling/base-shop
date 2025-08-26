import "@testing-library/jest-dom";
import { fireEvent, render, screen, within, waitFor, act } from "@testing-library/react";
import type { ComponentProps } from "react";
import ThemeEditor from "../src/app/cms/shop/[shop]/themes/ThemeEditor";
import { updateShop } from "@cms/actions/shops.server";
import { savePreset, deletePreset } from "../src/app/cms/shop/[shop]/themes/page";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));
jest.mock("../src/app/cms/shop/[shop]/themes/page", () => ({
  savePreset: jest.fn(),
  deletePreset: jest.fn(),
}));
jest.mock(
  "@/components/cms/StyleEditor",
  () => {
    const React = require("react");
    function MockStyleEditor({
      tokens = {},
      baseTokens = {},
      onChange,
      focusToken,
    }: any) {
      const ref = React.useRef<HTMLDivElement | null>(null);
      React.useEffect(() => {
        if (!focusToken) return;
        const el = ref.current?.querySelector(
          `[data-token-key="${focusToken}"]`
        ) as HTMLElement | null;
        el?.scrollIntoView?.();
        const input = el?.querySelector("input");
        (input as HTMLElement | null)?.focus();
      }, [focusToken]);
      return (
        <div ref={ref}>
          {Object.entries(baseTokens).map(([k, defaultValue]: any) => {
            const val = (tokens as any)[k] || defaultValue;
            return (
              <label key={k} data-token-key={k}>
                <input
                  aria-label={k}
                  type="color"
                  value={val}
                  onChange={(e) =>
                    onChange({ ...(tokens as any), [k]: e.target.value })
                  }
                />
              </label>
            );
          })}
        </div>
      );
    }
    return { __esModule: true, default: MockStyleEditor };
  },
  { virtual: true }
);
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: (props: any) => <button {...props} />,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true }
);
jest.mock("../src/app/cms/wizard/WizardPreview", () => ({
  __esModule: true,
  default: ({ onTokenSelect }: any) => (
    <div>
      <div
        data-token="--color-primary"
        onClick={(e: any) =>
          onTokenSelect(e.currentTarget.getAttribute("data-token"), {
            x: 0,
            y: 0,
          })
        }
      />
      <div
        data-token="--color-bg"
        onClick={(e: any) =>
          onTokenSelect(e.currentTarget.getAttribute("data-token"), {
            x: 0,
            y: 0,
          })
        }
      />
    </div>
  ),
}));

export { fireEvent, render, screen, within, waitFor, act };

export const mockUpdateShop = updateShop as jest.Mock;
export const mockSavePreset = savePreset as jest.Mock;
export const mockDeletePreset = deletePreset as jest.Mock;

export interface RenderOptions
  extends Partial<ComponentProps<typeof ThemeEditor>> {}

export function renderThemeEditor(options: RenderOptions = {}) {
  const defaultProps: ComponentProps<typeof ThemeEditor> = {
    shop: "test",
    themes: ["base"],
    tokensByTheme: { base: { "--color-bg": "#ffffff" } },
    initialTheme: "base",
    initialOverrides: {},
    presets: [],
  };
  return render(<ThemeEditor {...defaultProps} {...options} />);
}
