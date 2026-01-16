import { screen } from "@testing-library/react";
import { assertRouteHead } from "@tests/head";
import { renderRouteModule } from "@tests/renderers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import dealsPageEn from "@/locales/en/dealsPage.json";
import * as DealsRoute from "@/routes/deals";

const openModalMock = vi.hoisted(() => vi.fn());

vi.mock("@/context/ModalContext", () => ({
  __esModule: true,
  useOptionalModal: () => ({ openModal: openModalMock }),
  ModalProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@acme/ui/atoms/Button", () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props} />
  ),
}));

vi.mock("@acme/ui/atoms/Section", () => ({
  Section: ({ children, as: Component = "section", ...props }: any) => (
    <Component data-testid="section" {...props}>
      {children}
    </Component>
  ),
}));

vi.mock("lucide-react", () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon" {...props} />;
  return {
    __esModule: true,
    CheckCircle2: Icon,
    Hotel: Icon,
    Coffee: Icon,
    Percent: Icon,
    Wine: Icon,
  };
});

vi.mock("@/components/seo/DealsStructuredData", () => ({
  __esModule: true,
  default: () => <script data-testid="deals-json" />,
}));

vi.mock("@/utils/slug", () => ({
  getSlug: (segment: string, lang: string) => `${segment}-${lang}`,
}));

const renderDeals = async (route = "/en/deals-en") => {
  const view = await renderRouteModule(DealsRoute, { route });
  await view.ready();
  await screen.findByRole("heading", { level: 2, name: /Perks/i });
  return view;
};

let dateNowSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  openModalMock.mockClear();
  dateNowSpy?.mockRestore();
  dateNowSpy = undefined;
});

afterEach(() => {
  dateNowSpy?.mockRestore();
});

describe("deals route", () => {
  it("renders active deal content and opens the booking modal", async () => {
    dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(new Date("2025-07-15T12:00:00Z").getTime());

    const view = await renderDeals();

    expect(document.querySelector('meta[name="robots"]')).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: /perks/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("icon")).not.toHaveLength(0);

    await view.user.click(screen.getByRole("button", { name: /reserve/i }));
    expect(openModalMock).toHaveBeenCalledWith("booking");

    assertRouteHead({
      title: (dealsPageEn.meta?.title as string | undefined) ?? "",
      description: (dealsPageEn.meta?.description as string | undefined) ?? "",
      path: "/en/deals-en",
      lang: "en",
    });
    expect(screen.getByTestId("deals-json")).toBeInTheDocument();
  });

  it("renders expired state with robots directive and fallback CTA", async () => {
    dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(new Date("2026-01-01T00:00:00Z").getTime());

    await renderDeals();

    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,follow");
    const fallbackLink = document.querySelector('a[href="/en/rooms-en"]');
    expect(fallbackLink).not.toBeNull();
    expect(openModalMock).not.toHaveBeenCalled();
  });
});