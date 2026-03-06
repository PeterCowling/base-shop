/** @jest-environment jsdom */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

function LocaleSwitchProbe() {
  const { locale, setLocale } = useUploaderI18n();
  return (
    <>
      <div data-testid="locale">{locale}</div>
      <button type="button" onClick={() => setLocale("en")} data-testid="set-en">
        EN
      </button>
      <button type="button" onClick={() => setLocale("zh")} data-testid="set-zh">
        ZH
      </button>
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

  it("switches between zh and en and persists each toggle", async () => {
    render(
      <UploaderI18nProvider>
        <LocaleSwitchProbe />
      </UploaderI18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("zh");
    fireEvent.click(screen.getByTestId("set-en"));
    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("en");
      expect(window.localStorage.getItem("xa_uploader_locale")).toBe("en");
      expect(document.documentElement.lang).toBe("en");
    });

    fireEvent.click(screen.getByTestId("set-zh"));
    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("zh");
      expect(window.localStorage.getItem("xa_uploader_locale")).toBe("zh");
      expect(document.documentElement.lang).toBe("zh");
    });
  });
});
