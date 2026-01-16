import { screen } from "@testing-library/react";
import { assertRouteHead } from "@tests/head";
import { renderRouteModule } from "@tests/renderers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import * as loadI18nNs from "@/utils/loadI18nNs";
import notFoundPageEn from "@/locales/en/notFoundPage.json";
import * as NotFoundRoute from "@/routes/NotFound";

const modalControls = vi.hoisted(() => ({
  includeOptional: { current: true },
  openModal: vi.fn(),
}));

vi.mock("@/context/ModalContext", () => ({
  __esModule: true,
  get useOptionalModal() {
    return modalControls.includeOptional.current
      ? () => ({ openModal: modalControls.openModal })
      : undefined;
  },
  useModal: () => ({ openModal: modalControls.openModal }),
  ModalProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@acme/ui/atoms/Button", () => ({
  Button: ({ children, onClick, asChild, ...props }: any) =>
    asChild ? (
      <>{children}</>
    ) : (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
}));

vi.mock("@acme/ui/atoms/Link", () => ({
  AppLink: ({ to, children, ...props }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/common/Page", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="page">{children}</div>,
}));

vi.mock("@/utils/slug", () => ({
  getSlug: (segment: string, lang: string) => `${segment}-${lang}`,
}));

const renderNotFound = async (route = "/en/404") => {
  const view = await renderRouteModule(NotFoundRoute, { route });
  await view.ready();
  await screen.findByRole("heading", { level: 1 });
  return view;
};

beforeEach(() => {
  modalControls.includeOptional.current = true;
  modalControls.openModal.mockClear();
});

describe("not-found clientLoader", () => {
  it("preloads namespaces and resolves metadata", async () => {
    const preloadSpy = vi.spyOn(loadI18nNs, "preloadNamespacesWithFallback");
    const changeSpy = vi.spyOn(i18n, "changeLanguage");

    const data = await NotFoundRoute.clientLoader({
      request: new Request("https://example.com/en/404"),
    } as Parameters<NonNullable<typeof NotFoundRoute.clientLoader>>[0]);

    expect(preloadSpy).toHaveBeenCalledWith("en", ["notFoundPage"]);
    expect(changeSpy).toHaveBeenCalledWith("en");
    expect(data).toMatchObject({
      lang: "en",
      title: expect.any(String),
      desc: expect.any(String),
    });

    preloadSpy.mockRestore();
    changeSpy.mockRestore();
  });

  it("throws a 404 when the prefix is invalid", async () => {
    await expect(
      NotFoundRoute.clientLoader({
        request: new Request("https://example.com/zz/404"),
      } as Parameters<NonNullable<typeof NotFoundRoute.clientLoader>>[0]),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("not-found route", () => {
  it("renders heading and navigation links with localized head tags", async () => {
    await renderNotFound();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);

    assertRouteHead({
      title: (notFoundPageEn.meta?.title as string | undefined) ?? "",
      description: (notFoundPageEn.meta?.description as string | undefined) ?? "",
      path: "/en/404",
      lang: "en",
      ogType: "website",
    });
  });

  it("falls back to the mandatory modal hook when the optional access is unavailable", async () => {
    modalControls.includeOptional.current = false;

    const view = await renderNotFound();
    await view.user.click(screen.getByRole("button", { name: /reserve/i }));

    expect(modalControls.openModal).toHaveBeenCalledWith("booking");
  });
});