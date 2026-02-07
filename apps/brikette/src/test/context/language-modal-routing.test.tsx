import "@testing-library/jest-dom";

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LanguageGlobalModal } from "@/context/modal/global-modals/LanguageModal";
import { renderWithProviders } from "@tests/renderers";

const closeModalMock = jest.fn();
const replaceMock = jest.fn();
const pushMock = jest.fn();
const changeLanguageMock = jest.fn(async (_lang: string) => {});

let pathname = "/en/assistance/hostel-faqs";
let searchParams = new URLSearchParams("from=language-modal");

jest.mock("@/context/modal/hooks", () => ({
  useModal: () => ({
    closeModal: closeModalMock,
  }),
}));

jest.mock("@/context/modal/global-modals/../hooks", () => ({
  useModal: () => ({
    closeModal: closeModalMock,
  }),
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("@/context/modal/lazy-modals", () => ({
  LanguageModal: ({
    onSelect,
    options,
  }: {
    onSelect: (code: string) => void;
    options: Array<{ code: string; label: string }>;
  }) => (
    <div>
      {options.map((option) => (
        <button key={option.code} type="button" onClick={() => onSelect(option.code)}>
          select-{option.code}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("@/context/modal/global-modals/../lazy-modals", () => ({
  LanguageModal: ({
    onSelect,
    options,
  }: {
    onSelect: (code: string) => void;
    options: Array<{ code: string; label: string }>;
  }) => (
    <div>
      {options.map((option) => (
        <button key={option.code} type="button" onClick={() => onSelect(option.code)}>
          select-{option.code}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
  useSearchParams: () => searchParams,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: changeLanguageMock,
    },
  }),
}));

jest.mock("@/context/modal/constants", () => ({
  CORE_LAYOUT_NAMESPACES: ["header", "footer"],
  i18nConfig: {
    supportedLngs: ["en", "it", "de"],
    fallbackLng: "en",
  },
}));

jest.mock("@/context/modal/global-modals/../constants", () => ({
  CORE_LAYOUT_NAMESPACES: ["header", "footer"],
  i18nConfig: {
    supportedLngs: ["en", "it", "de"],
    fallbackLng: "en",
  },
}));

jest.mock("@/utils/loadI18nNs", () => ({
  preloadI18nNamespaces: async () => {},
}));

jest.mock("@/utils/translate-path", () => ({
  translatePath: (slugKey: string, lang: string) => {
    const map: Record<string, Record<string, string>> = {
      assistance: { en: "help", it: "assistenza", de: "hilfe" },
      experiences: { en: "experiences", it: "esperienze", de: "erlebnisse" },
      guides: { en: "guides", it: "guide", de: "reisefuehrer" },
      howToGetHere: { en: "how-to-get-here", it: "come-arrivare", de: "anfahrt" },
      guidesTags: { en: "tags", it: "etichette", de: "schlagwoerter" },
    };
    return map[slugKey]?.[lang] ?? `${slugKey}-${lang}`;
  },
}));

jest.mock("@/routes.guides-helpers", () => ({
  guideSlug: (lang: string, guideKey: string) => {
    if (guideKey === "hostelFaqs") {
      return lang === "it" ? "ostello-domande" : "hostel-faqs";
    }
    return guideKey;
  },
  resolveGuideKeyFromSlug: (slug: string, lang: string) => {
    if (slug === "hostel-faqs" && lang === "en") return "hostelFaqs";
    if (slug === "ostello-domande" && lang === "it") return "hostelFaqs";
    return null;
  },
}));

describe("LanguageGlobalModal routing", () => {
  beforeEach(() => {
    pathname = "/en/assistance/hostel-faqs";
    searchParams = new URLSearchParams("from=language-modal");
    closeModalMock.mockClear();
    replaceMock.mockClear();
    pushMock.mockClear();
    changeLanguageMock.mockClear();
    window.history.replaceState({}, "", `${pathname}?from=language-modal#faq`);
  });

  it("translates internal assistance routes and nested guide slug", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageGlobalModal />);

    await user.click(screen.getByRole("button", { name: "select-it" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/it/assistenza/ostello-domande?from=language-modal#faq");
    });
    expect(changeLanguageMock).toHaveBeenCalledWith("it");
    expect(closeModalMock).toHaveBeenCalled();
  });

  it("translates experiences tags segment when pathname uses internal segments", async () => {
    pathname = "/en/experiences/tags/beaches";
    searchParams = new URLSearchParams("");
    window.history.replaceState({}, "", pathname);

    const user = userEvent.setup();
    renderWithProviders(<LanguageGlobalModal />);

    await user.click(screen.getByRole("button", { name: "select-it" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/it/esperienze/etichette/beaches");
    });
  });
});
