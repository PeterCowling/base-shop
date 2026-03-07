/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
import "../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { getRoomSlug } from "../../config/roomSlugs";
import { getPrivateRoomChildPath } from "../../utils/privateRoomPaths";
import DesktopHeader from "../DesktopHeader";

jest.mock("../../molecules/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

jest.mock("../../molecules/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));

const i18nState = {
  language: "en",
  bundles: {
    en: {
      header: {},
      _tokens: {
        checkAvailability: "Check availability",
      },
    },
    ar: {
      header: {
        home: "الرئيسية",
        rooms: "دورمتوريات",
        apartment: "غرف خاصة",
        experiences: "التجارب",
        howToGetHere: "كيفية الوصول إلينا",
        deals: "العروض",
        assistance: "المساعدة",
        navChildren: {
          rooms: {
            all: "عرض جميع الغرف",
            room_10: "مهجع مختلط – حمّام داخلي",
          },
          apartment: {
            bookPrivate: "احجز الغرف الخاصة",
            apartment: "شقة",
            doubleRoom: "غرفة مزدوجة",
          },
        },
      },
      _tokens: {
        checkAvailability: "تحقق من التوفّر",
      },
    },
  } as Record<string, Record<string, Record<string, unknown>>>,
};

function readKey(bundle: Record<string, unknown> | undefined, key: string): unknown {
  return key.split(".").reduce<unknown>((cursor, segment) => {
    if (!cursor || typeof cursor !== "object") return undefined;
    return (cursor as Record<string, unknown>)[segment];
  }, bundle);
}

jest.mock("react-i18next", () => ({
  useTranslation: (namespace?: string, opts?: { lng?: string }) => {
    const lang = opts?.lng ?? i18nState.language;
    const ns = namespace ?? "translation";
    return {
      t: (key: string, options?: { defaultValue?: string }) => {
        const value = readKey(i18nState.bundles[lang]?.[ns], key);
        if (typeof value === "string") return value;
        return options?.defaultValue ?? key;
      },
      i18n: {
        language: lang,
        resolvedLanguage: lang,
        getFixedT: (fixedLang: string, fixedNamespace?: string) => (key: string, options?: { defaultValue?: string }) => {
          const value = readKey(
            i18nState.bundles[fixedLang]?.[fixedNamespace ?? "translation"],
            key,
          );
          if (typeof value === "string") return value;
          return options?.defaultValue ?? key;
        },
        hasResourceBundle: (bundleLang: string, bundleNamespace: string) =>
          Boolean(i18nState.bundles[bundleLang]?.[bundleNamespace]),
      },
      ready: true,
    };
  },
}));

describe("DesktopHeader rooms dropdown", () => {
  beforeEach(() => {
    i18nState.language = "en";
  });

  it("renders sub-menu trigger buttons for Rooms and Apartment nav items", () => {
    render(<DesktopHeader lang="en" />);
    const triggers = screen.getAllByRole("button", { name: /sub-menu/i });
    expect(triggers).toHaveLength(2);
    const labels = triggers.map((el) => el.getAttribute("aria-label"));
    expect(labels).toContain("rooms sub-menu");
    expect(labels).toContain("apartment sub-menu");
  });

  it("TC-01: clicking the trigger opens the panel with 11 items", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    const trigger = screen.getByRole("button", { name: "Rooms sub-menu" });
    await user.click(trigger);

    const items = screen.getAllByRole("menuitem");
    expect(items.length).toBe(11);
  });

  it("TC-03: Double Room sub-link renders with correct href", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    await user.click(screen.getByRole("button", { name: "Rooms sub-menu" }));

    const mixedEnsuiteDormLink = screen.getByRole("menuitem", { name: "Mixed Ensuite Dorm" });
    expect(mixedEnsuiteDormLink).toHaveAttribute(
      "href",
      `/en/dorms/${getRoomSlug("room_10", "en")}`,
    );
  });

  it("See-all-rooms sentinel is the first menuitem", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    await user.click(screen.getByRole("button", { name: "Rooms sub-menu" }));

    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveTextContent("See all rooms");
  });

  it("Escape closes the open dropdown", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    await user.click(screen.getByRole("button", { name: "Rooms sub-menu" }));
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(0);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("renders Arabic top-level and child navigation labels from localized bundles", async () => {
    const user = userEvent.setup();
    i18nState.language = "ar";

    render(<DesktopHeader lang="ar" />);

    expect(screen.getByRole("link", { name: "الرئيسية" })).toHaveAttribute("href", "/ar");
    expect(screen.getByRole("link", { name: "دورمتوريات" })).toHaveAttribute(
      "href",
      "/ar/hajz",
    );
    expect(screen.getByRole("link", { name: "غرف خاصة" })).toHaveAttribute(
      "href",
      "/ar/ghuraf-khassa",
    );

    await user.click(screen.getByRole("button", { name: "دورمتوريات sub-menu" }));
    expect(screen.getByRole("menuitem", { name: "عرض جميع الغرف" })).toHaveAttribute(
      "href",
      "/ar/hajz",
    );
    expect(screen.getByRole("menuitem", { name: "مهجع مختلط – حمّام داخلي" })).toHaveAttribute(
      "href",
      `/ar/ghuraf/${getRoomSlug("room_10", "ar")}`,
    );

    await user.click(screen.getByRole("button", { name: "غرف خاصة sub-menu" }));
    expect(screen.getByRole("menuitem", { name: "احجز الغرف الخاصة" })).toHaveAttribute(
      "href",
      "/ar/hajz-iqama-khassa",
    );
    expect(screen.getByRole("menuitem", { name: "شقة" })).toHaveAttribute(
      "href",
      `/ar${getPrivateRoomChildPath("ar", "apartment")}`,
    );
    expect(screen.getByRole("menuitem", { name: "غرفة مزدوجة" })).toHaveAttribute(
      "href",
      `/ar${getPrivateRoomChildPath("ar", "double-room")}`,
    );
  });

  it.todo("entering portal panel clears close timer — manual browser test required");
});
