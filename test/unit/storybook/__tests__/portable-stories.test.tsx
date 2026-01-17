import { afterEach, describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react";

type StoryModule = {
  default?: {
    component?: (props: Record<string, unknown>) => JSX.Element | null;
    args?: Record<string, unknown>;
  };
  [key: string]: unknown;
};

const composeStories = (stories: StoryModule) => {
  const { component: Component, args: defaultArgs } = stories.default ?? {};
  const composed: Record<string, (props?: Record<string, unknown>) => JSX.Element | null> = {};

  Object.entries(stories).forEach(([key, story]) => {
    if (key === "default" || !Component) return;
    const storyArgs = (story as { args?: Record<string, unknown> })?.args ?? {};
    composed[key] = (props = {}) => (
      <Component {...defaultArgs} {...storyArgs} {...props} />
    );
  });

  return composed;
};

import * as errorStories from "../../../../apps/storybook/.storybook/stories/ErrorScenarios.stories";

const { SafeUsage, ThrowsUsageError } = composeStories(errorStories);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("portable Storybook stories", () => {
  it("can render a safe story without depending on Storybook runtime", () => {
    const { container } = render(<SafeUsage />);

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        data-testid="error-button"
        type="button"
      >
        Trigger
      </button>
    `);
  });

  it("surfaces intentional usage errors for diagnostic stories", () => {
    expect(() => render(<ThrowsUsageError />)).toThrow(
      "Portable stories usage guard triggered",
    );
  });
});
