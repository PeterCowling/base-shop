// apps/cms/__tests__/previewTokens.test.ts
/* eslint-env jest */

import {
  loadPreviewTokens,
  PREVIEW_TOKENS_EVENT,
  PREVIEW_TOKENS_KEY,
  savePreviewTokens,
} from "../src/app/cms/wizard/previewTokens";

describe("previewTokens", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves tokens and dispatches event", () => {
    const spy = jest.fn();
    window.addEventListener(PREVIEW_TOKENS_EVENT, spy);

    savePreviewTokens({ "--color-bg": "red" });

    expect(localStorage.getItem(PREVIEW_TOKENS_KEY)).toBe(
      JSON.stringify({ "--color-bg": "red" })
    );
    expect(spy).toHaveBeenCalled();
    window.removeEventListener(PREVIEW_TOKENS_EVENT, spy);
  });

  it("returns empty object on JSON errors", () => {
    localStorage.setItem(PREVIEW_TOKENS_KEY, "not-json");
    expect(loadPreviewTokens()).toEqual({});
  });
});

