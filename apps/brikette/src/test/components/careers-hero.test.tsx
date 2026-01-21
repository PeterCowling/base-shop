import "@testing-library/jest-dom";
import type { ComponentPropsWithoutRef } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@tests/renderers";

import CareersHero from "@/components/careers/CareersHero";

jest.mock("@acme/ui/atoms/Button", () => ({
  Button: ({ children, ...props }: ComponentPropsWithoutRef<"button">) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

type HeroImageProps = ComponentPropsWithoutRef<"img"> & { priority?: boolean };

jest.mock("@/components/images/CfHeroImage", () => ({
  CfHeroImage: ({ priority: _priority, ...props }: HeroImageProps) => <img {...props} />,
}));

const openModalSpy = jest.fn();

jest.mock("@/context/ModalContext", () => ({
  useModal: () => ({
    activeModal: null,
    modalData: null,
    openModal: openModalSpy,
    closeModal: jest.fn(),
  }),
}));

type NamespaceData = Record<string, unknown>;

const baseStore: Record<string, NamespaceData> = {
  en: {
    translation: {
      careers: {
        jobTitle: "Join the Hostel Brikette team",
        jobDescription: "We're always looking for energetic people who love hospitality.",
        ctaLabel: "Ask about open roles",
      },
    },
    careersPage: {
      careersSection: {
        altProfessional: "Hostel Brikette team member helping a guest",
      },
    },
  },
  es: {
    translation: {
      careers: {
        jobTitle: "Unete al equipo de Hostel Brikette",
        jobDescription: "",
        ctaLabel: "",
      },
    },
    careersPage: {
      careersSection: {
        altProfessional: "",
      },
    },
  },
  de: {
    translation: {
      careers: {},
    },
    careersPage: {
      careersSection: {},
    },
  },
};

let resourceStore: Record<string, NamespaceData> = JSON.parse(JSON.stringify(baseStore));

function readKey(lang: string, namespace: string, path: string): unknown {
  const data = resourceStore[lang]?.[namespace];
  if (!data || typeof data !== "object") return undefined;
  return path.split(".").reduce<unknown>((cursor, segment) => {
    if (cursor == null || typeof cursor !== "object") return undefined;
    return (cursor as Record<string, unknown>)[segment];
  }, data as Record<string, unknown>);
}

const i18nStub = {
  language: "en",
  languages: ["en"] as string[],
  getFixedT(lng: string, namespaces?: string | string[]) {
    const baseNamespaces = Array.isArray(namespaces)
      ? namespaces
      : namespaces
      ? [namespaces]
      : ["translation"];
    return (key: string, options?: { defaultValue?: unknown }) => {
      const [fromKey, rest] = key.includes(":") ? key.split(":", 2) : [undefined, key];
      const lookupNamespaces = fromKey ? [fromKey] : baseNamespaces;
      for (const candidate of lookupNamespaces) {
        const value = readKey(lng, candidate, rest);
        if (typeof value === "string" && value.trim().length > 0) {
          return value;
        }
      }
      return options?.defaultValue ?? key;
    };
  },
};

jest.mock("react-i18next", () => ({
  useTranslation: (namespace?: string | string[], opts?: { lng?: string }) => {
    const lang = opts?.lng?.trim()?.length ? opts.lng : i18nStub.language;
    if (opts?.lng && !i18nStub.languages.includes(opts.lng)) {
      i18nStub.languages = [opts.lng, ...i18nStub.languages];
    }
    i18nStub.language = lang;

    const namespaces = Array.isArray(namespace)
      ? namespace
      : namespace
      ? [namespace]
      : ["translation"];

    const translate = (key: string, options?: { defaultValue?: unknown }): string => {
      const [fromKey, rest] = key.includes(":") ? key.split(":", 2) : [undefined, key];
      const lookupNamespaces = fromKey ? [fromKey] : namespaces;
      for (const candidate of lookupNamespaces) {
        const value = readKey(lang, candidate, rest);
        if (typeof value === "string" && value.trim().length > 0) {
          return value;
        }
      }
      if (typeof options?.defaultValue === "string") {
        return options.defaultValue;
      }
      return key;
    };

    return {
      t: translate,
      i18n: i18nStub,
    };
  },
}));

describe("CareersHero", () => {
  beforeEach(() => {
    resourceStore = JSON.parse(JSON.stringify(baseStore));
    i18nStub.language = "en";
    i18nStub.languages = ["en"];
    openModalSpy.mockClear();
  });

  it("uses language-specific strings when available and falls back to English defaults", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CareersHero lang="es" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Unete al equipo de Hostel Brikette" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We're always looking for energetic people who love hospitality."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask about open roles" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Hostel Brikette team member helping a guest" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ask about open roles" }));
    expect(openModalSpy).toHaveBeenCalledWith("contact");
  });

  it("falls back entirely to English copy when the locale has no overrides", () => {
    renderWithProviders(<CareersHero lang="de" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Join the Hostel Brikette team" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We're always looking for energetic people who love hospitality."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask about open roles" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Hostel Brikette team member helping a guest" }),
    ).toBeInTheDocument();
  });

  it("falls back to the raw keys when neither locale nor English strings exist", () => {
    resourceStore.en.translation = { careers: {} };
    resourceStore.en.careersPage = { careersSection: {} };

    renderWithProviders(<CareersHero lang="fr" />);

    expect(screen.getByRole("heading", { level: 1, name: "careers.jobTitle" })).toBeInTheDocument();
    expect(screen.getByText("careers.jobDescription")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "careers.ctaLabel" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "careersSection.altProfessional" }),
    ).toBeInTheDocument();
  });

  it("uses the identity fallback translator when getFixedT is unavailable", () => {
    const originalGetFixedT = i18nStub.getFixedT;
    delete (i18nStub as { getFixedT?: typeof i18nStub.getFixedT }).getFixedT;

    resourceStore.en.translation = { careers: {} };
    resourceStore.en.careersPage = { careersSection: {} };

    renderWithProviders(<CareersHero lang="es" />);

    expect(screen.getByRole("heading", { level: 1, name: "careers.jobTitle" })).toBeInTheDocument();
    expect(screen.getByText("careers.jobDescription")).toBeInTheDocument();

    i18nStub.getFixedT = originalGetFixedT;
  });

  it("does not pass a default value when the English fallback is not a string", () => {
    const originalGetFixedT = i18nStub.getFixedT;
    i18nStub.getFixedT = () => ((key: string) => ({ key }) as unknown as string);

    renderWithProviders(<CareersHero lang="es" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Unete al equipo de Hostel Brikette" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We're always looking for energetic people who love hospitality."),
    ).toBeInTheDocument();

    i18nStub.getFixedT = originalGetFixedT;
  });
});