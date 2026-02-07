// packages/i18n/__tests__/hydration.test.tsx
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { TranslationsProvider, useTranslations } from "../src/Translations";

// `act` is attached to the default React export in jest.setup.ts for
// compatibility with the React 19 canary build.
const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };

describe("TranslationsProvider hydration", () => {
  function Greeting() {
    const t = useTranslations();
    return <div>{t("hello")}</div>;
  }

  it("hydrates without warnings", async () => {
    const html = renderToString(
      <TranslationsProvider messages={{ hello: "Hallo" }}>
        <Greeting />
      </TranslationsProvider>
    );

    const container = document.createElement("div");
    container.innerHTML = html;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      hydrateRoot(
        container,
        <TranslationsProvider messages={{ hello: "Hallo" }}>
          <Greeting />
        </TranslationsProvider>
      );

      await Promise.resolve();
    });

    expect(spy).not.toHaveBeenCalled();
    expect(container.textContent).toBe("Hallo");
    spy.mockRestore();
  });
});
