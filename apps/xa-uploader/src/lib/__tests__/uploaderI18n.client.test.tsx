/** @jest-environment jsdom */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";

import { UploaderI18nProvider, useUploaderI18n } from "../uploaderI18n.client";

function LocaleProbe() {
  const { locale, t } = useUploaderI18n();
  return (
    <>
      <div data-testid="locale">{locale}</div>
      <div data-testid="language-label">{t("languageLabel")}</div>
    </>
  );
}

describe("UploaderI18nProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "";
  });

  it("defaults xa-uploader locale to zh when no stored locale exists", async () => {
    render(
      <UploaderI18nProvider>
        <LocaleProbe />
      </UploaderI18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("zh");
    expect(screen.getByTestId("language-label")).toHaveTextContent("语言");
    await waitFor(() => {
      expect(window.localStorage.getItem("xa_uploader_locale")).toBe("zh");
      expect(document.documentElement.lang).toBe("zh");
    });
  });

  it("still respects a stored en locale override", async () => {
    window.localStorage.setItem("xa_uploader_locale", "en");

    render(
      <UploaderI18nProvider>
        <LocaleProbe />
      </UploaderI18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("en");
      expect(screen.getByTestId("language-label")).toHaveTextContent("Language");
      expect(document.documentElement.lang).toBe("en");
    });
  });
});
