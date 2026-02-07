import "@testing-library/jest-dom";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@tests/renderers";

import LocationInline from "@/components/booking/LocationInline";

type ModalMessages = {
  modals: Record<string, string>;
};

const baseResources: Record<string, ModalMessages> = {
  en: { modals: {} },
  it: {
    modals: {
      "location.nearbyBusCompact": "About 120 m from the bus stop",
      getDirections: "Get directions",
    },
  },
  fr: {
    modals: {
      "location.nearbyBusCompact": "About 120 m from the next bus stop",
      getDirections: "Get directions",
    },
  },
};

let resourceStore: Record<string, ModalMessages> = JSON.parse(JSON.stringify(baseResources));

const openModalSpy = jest.fn();

jest.mock("@/context/ModalContext", () => ({
  useModal: () => ({
    activeModal: null,
    modalData: null,
    openModal: openModalSpy,
    closeModal: jest.fn(),
  }),
}));

const i18nStub = {
  language: "en",
  languages: ["en"] as string[],
  options: { fallbackLng: undefined as unknown },
  getResource(lng: string, namespace: string, key: string): unknown {
    if (namespace !== "modals") return undefined;
    return resourceStore[lng]?.modals[key];
  },
};

let bypassPrimaryLookup = false;
let provideI18nInstance = true;

jest.mock("react-i18next", () => ({
  useTranslation: (_namespace?: string | string[], opts?: { lng?: string }) => {
    const lang = opts?.lng?.trim()?.length ? opts.lng : i18nStub.language;
    if (opts?.lng && !i18nStub.languages.includes(opts.lng)) {
      i18nStub.languages = [opts.lng, ...i18nStub.languages];
    }
    i18nStub.language = lang;

    const translate = (key: string): string => {
      if (bypassPrimaryLookup) {
        return key;
      }
      const value = resourceStore[lang]?.modals[key];
      return typeof value === "string" ? value : key;
    };

    return {
      t: translate,
      i18n: provideI18nInstance ? i18nStub : undefined,
    };
  },
}));

describe("LocationInline", () => {
  beforeEach(() => {
    resourceStore = JSON.parse(JSON.stringify(baseResources));
    i18nStub.language = "en";
    i18nStub.languages = ["en"];
    i18nStub.options.fallbackLng = undefined;
    openModalSpy.mockClear();
    bypassPrimaryLookup = false;
    provideI18nInstance = true;
  });

  it("renders translations for the provided language and opens the modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LocationInline lang="it" />);

    expect(screen.getByText("About 120 m from the bus stop")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Get directions" });
    await user.click(button);
    expect(openModalSpy).toHaveBeenCalledWith("location");
  });

  it("falls back to the configured fallback language object when translations are missing", () => {
    i18nStub.options.fallbackLng = { default: ["fr"] };
    renderWithProviders(<LocationInline />);

    expect(screen.getByText("About 120 m from the next bus stop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get directions" })).toBeInTheDocument();
  });

  it("prefers the provided language when the direct translation is unavailable", () => {
    bypassPrimaryLookup = true;
    renderWithProviders(<LocationInline lang="fr" />);

    expect(screen.getByText("About 120 m from the next bus stop")).toBeInTheDocument();
  });

  it("uses the first configured fallback language in an array", () => {
    bypassPrimaryLookup = true;
    i18nStub.options.fallbackLng = ["fr", "en"];

    renderWithProviders(<LocationInline />);

    expect(screen.getByText("About 120 m from the next bus stop")).toBeInTheDocument();
  });

  it("supports string fallbacks when translations are missing", () => {
    bypassPrimaryLookup = true;
    i18nStub.options.fallbackLng = "fr";

    renderWithProviders(<LocationInline />);

    expect(screen.getByRole("button", { name: "Get directions" })).toBeInTheDocument();
  });

  it("falls back to the active language when no fallback list is defined", () => {
    bypassPrimaryLookup = true;
    i18nStub.options.fallbackLng = undefined;
    i18nStub.language = "fr";

    renderWithProviders(<LocationInline />);

    expect(screen.getByText("About 120 m from the next bus stop")).toBeInTheDocument();
  });

  it("uses the languages array when the active language is empty", () => {
    bypassPrimaryLookup = true;
    i18nStub.options.fallbackLng = undefined;
    i18nStub.language = "";
    i18nStub.languages = ["fr"];

    renderWithProviders(<LocationInline />);

    expect(screen.getByText("About 120 m from the next bus stop")).toBeInTheDocument();
  });

  it("returns the key when no i18n instance or fallbacks are available", () => {
    bypassPrimaryLookup = true;
    provideI18nInstance = false;
    i18nStub.options.fallbackLng = undefined;
    i18nStub.language = "";
    i18nStub.languages = [];

    renderWithProviders(<LocationInline />);

    expect(screen.getByText("location.nearbyBusCompact")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "getDirections" })).toBeInTheDocument();
  });

  it("falls back to the active language when fallback defaults are empty", () => {
    bypassPrimaryLookup = true;
    i18nStub.language = "fr";
    i18nStub.options.fallbackLng = { default: ["", "fr"] } as unknown;

    renderWithProviders(<LocationInline />);

    expect(screen.getByText("About 120 m from the next bus stop")).toBeInTheDocument();
  });

  it("returns the translation key when the fallback resource is not a string", () => {
    bypassPrimaryLookup = true;
    i18nStub.options.fallbackLng = "fr";
    const originalFallback = resourceStore.fr.modals.getDirections;
    resourceStore.fr.modals.getDirections = { text: "ignored" } as unknown as string;

    renderWithProviders(<LocationInline />);

    expect(screen.getByRole("button", { name: "getDirections" })).toBeInTheDocument();

    resourceStore.fr.modals.getDirections = originalFallback;
  });
});