import { renderRouteModule } from "@tests/renderers";
import { screen } from "@testing-library/react";
import i18n from "@/i18n";
import * as HowToRoute from "@/routes/how-to-get-here.$slug";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/components/images/CfImage", () => ({
  __esModule: true,
  default: (props: React.ComponentPropsWithoutRef<"img">) => <img alt={props.alt} {...props} />,
  CfImage: (props: React.ComponentPropsWithoutRef<"img">) => <img alt={props.alt} {...props} />,
}));

vi.mock("@/components/images/CfResponsiveImage", () => ({
  __esModule: true,
  default: (props: React.ComponentPropsWithoutRef<"img">) => <img alt={props.alt} {...props} />,
  CfResponsiveImage: (props: React.ComponentPropsWithoutRef<"img">) => <img alt={props.alt} {...props} />,
}));

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("/how-to-get-here/$slug route", () => {
  it("renders hero, callouts, and resolves link bindings", async () => {
    const view = await renderRouteModule(HowToRoute, {
      route: "/en/how-to-get-here/capri-positano-ferry",
    });
    await view.ready();

    expect(
      await screen.findByRole("heading", { level: 1, name: /Capri to Positano – Ferry/i }),
    ).toBeInTheDocument();

    const overviewLink = screen.getByRole("link", { name: /How to Get Here overview/i });
    expect(overviewLink).toHaveAttribute("href", "/en/how-to-get-here");
    expect(overviewLink.closest("aside")?.textContent).toMatch(/route options or backups when seas are rough/i);

    expect(
      screen.getByRole("link", { name: "Capri.net – Capri ↔ Positano" }),
    ).toHaveAttribute("href", "https://www.capri.net/en/t/capri/positano");
    expect(
      screen.getByRole("link", { name: "Positano.com (aggregated schedule)" }),
    ).toHaveAttribute("href", "https://www.positano.com/en/ferry-schedule");

    expect(
      screen.getByRole("link", { name: "Ferry dock → Hostel Brikette, with luggage" }),
    ).toHaveAttribute("href", "/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage");

    expect(
      screen.getByRole("link", { name: "Naples Center → Positano by train then bus" }),
    ).toHaveAttribute("href", "/en/how-to-get-here/naples-center-train-bus");

    expect(
      screen.getByRole("heading", { level: 2, name: /Port to hostel by Interno Bus/i }),
    ).toBeInTheDocument();
  });
});