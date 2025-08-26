// packages/i18n/__tests__/hydration.test.tsx
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
// React 18 deprecates `act` from `react-dom/test-utils` in favour of the
// version exported from `react` itself. Importing from `react` avoids the
// console warning that was causing this test to fail.
import { act } from "react";
import { TranslationsProvider, useTranslations } from "../src/Translations";

describe("TranslationsProvider hydration", () => {
  function Greeting() {
    const t = useTranslations();
    return <div>{t("greet")}</div>;
  }

  it("hydrates without warnings", async () => {
    const html = renderToString(
      <TranslationsProvider messages={{ greet: "Hallo" }}>
        <Greeting />
      </TranslationsProvider>
    );

    const container = document.createElement("div");
    container.innerHTML = html;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      hydrateRoot(
        container,
        <TranslationsProvider messages={{ greet: "Hallo" }}>
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
