// packages/ui/src/components/cms/page-builder/__tests__/ColorThemeSelector.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ColorThemeSelector from "../ColorThemeSelector";
import themes from "../color-themes.json";

describe("ColorThemeSelector", () => {
  test("renders themes and applies one via onChange", () => {
    const onChange = jest.fn();
    const baseTokens = {
      "--color-bg": "0 0% 0%",
      "--color-fg": "0 0% 100%",
      "--color-primary": "0 0% 50%",
      "--color-primary-dark": "0 0% 50%",
      "--color-accent": "0 0% 50%",
      "--color-accent-dark": "0 0% 50%",
      "--color-muted": "0 0% 50%",
      "--color-muted-dark": "0 0% 50%",
    } as any;
    render(
      <ColorThemeSelector
        tokens={{} as any}
        baseTokens={baseTokens as any}
        onChange={onChange}
      />
    );

    // Click first "Use theme"
    const btn = screen.getAllByText(/Use theme/i)[0];
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0] as Record<string, string>;
    // should include some -dark keys merged
    const hasDark = Object.keys(next).some((k) => k.endsWith("-dark"));
    expect(hasDark).toBe(true);
  });

  test("filters by tag and shows Selected when tokens match", () => {
    const onChange = jest.fn();
    const t = (themes as any[])[0];
    // Build tokens that exactly match first theme (light + -dark)
    const baseTokens = {} as any;
    const tokens: any = {};
    Object.entries(t.light).forEach(([k, v]: any) => { tokens[k] = v; baseTokens[k] = v; });
    Object.entries(t.dark).forEach(([k, v]: any) => { tokens[`${k}-dark`] = v; baseTokens[`${k}-dark`] = v; });

    const first = render(
      <ColorThemeSelector
        tokens={tokens}
        baseTokens={baseTokens}
        onChange={onChange}
        tagFilters={[String((t.tags||[])[0] || "modern")]}
      />
    );
    // Selected badge visible within first render
    expect(first.getByText(/Selected/i)).toBeInTheDocument();
    first.unmount();
    // Using a non-existent tag should show no cards
    const second = render(
      <ColorThemeSelector
        tokens={{} as any}
        baseTokens={baseTokens}
        onChange={onChange}
        tagFilters={["__nope__"]}
      />
    );
    expect(second.queryAllByText(/Use theme/i).length).toBe(0);
  });
});
