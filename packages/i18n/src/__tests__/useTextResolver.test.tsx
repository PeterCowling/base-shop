import type { PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";

import type { Locale, TranslatableText } from "@acme/types";

import { TranslationsProvider } from "../Translations";
import { useTextResolver } from "../useTextResolver";

describe("useTextResolver", () => {
  it("returns a resolver bound to locale and translations", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hallo" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(
      () => useTextResolver("de" as Locale),
      { wrapper }
    );

    const resolver = result.current;
    const value: TranslatableText = {
      type: "key",
      key: "greet",
    } as TranslatableText;

    expect(resolver(value)).toBe("Hallo");
  });
});
