import { render } from "@testing-library/react";
import { TranslationsProvider, useTranslations } from "../src/Translations";
import type { ReactNode } from "react";

describe("useTranslations behaviour", () => {
  it("returns translations, warns on missing keys, and memoises function", () => {
    let translate: (key: string) => string = () => "";
    function Consumer({ children }: { children?: ReactNode }) {
      translate = useTranslations();
      return <>{children}</>;
    }

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const messages = { hello: "Hallo" };
    const { rerender } = render(
      <TranslationsProvider messages={messages}>
        <Consumer />
      </TranslationsProvider>
    );

    expect(translate("hello")).toBe("Hallo");
    expect(translate("missing")).toBe("missing");
    expect(warnSpy).toHaveBeenCalledWith("Missing translation for key: missing");

    const firstFn = translate;
    rerender(
      <TranslationsProvider messages={messages}>
        <Consumer />
      </TranslationsProvider>
    );
    expect(translate).toBe(firstFn);

    rerender(
      <TranslationsProvider messages={{ hello: "Bonjour" }}>
        <Consumer />
      </TranslationsProvider>
    );
    expect(translate).not.toBe(firstFn);
    expect(translate("hello")).toBe("Bonjour");

    warnSpy.mockRestore();
  });
});
