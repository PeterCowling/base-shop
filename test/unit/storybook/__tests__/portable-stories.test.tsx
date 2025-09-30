import { afterEach, describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react";
import { composeStories } from "@storybook/react";

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
