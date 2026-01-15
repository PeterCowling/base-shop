import { screen } from "@testing-library/react";
import { renderRouteModule } from "@tests/renderers";
import { describe, expect, it, vi } from "vitest";
import * as AssistanceHubLinksModule from "@/routes/assistance/assistance-hub-links";
import { ASSISTANCE_HUB_TEST_IDS } from "@/routes/assistance/assistance-hub-links";

vi.mock("@acme/ui/atoms/Section", () => ({
  Section: ({ children, ...rest }: { children: React.ReactNode }) => (
    <section {...rest}>{children}</section>
  ),
}));

const baseProps = {
  heading: "Need more help?",
  intro: "Pick a path below",
  howTo: {
    eyebrow: "How to",
    title: "Getting here",
    summary: "Travel tips",
    href: "/en/how-to",
  },
  experiences: {
    eyebrow: "Experiences",
    title: "Plan your stay",
    summary: "Ideas and activities",
    href: "/en/experiences",
  },
} as const;

const renderHubLinks = (props = baseProps) =>
  renderRouteModule(AssistanceHubLinksModule, {
    props,
    route: "/en/assistance",
  });

describe("AssistanceHubLinks", () => {
  it("renders optional copy when provided", async () => {
    await renderHubLinks();

    expect(screen.getByTestId(ASSISTANCE_HUB_TEST_IDS.section)).toBeInTheDocument();
    expect(screen.getByText(baseProps.intro)).toBeInTheDocument();
    expect(screen.getByText(baseProps.howTo.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(baseProps.howTo.summary)).toBeInTheDocument();
    expect(screen.getByText(baseProps.experiences.summary)).toBeInTheDocument();
  });

  it("omits optional fields when they are empty", async () => {
    await renderHubLinks({
      heading: "Explore",
      howTo: { title: "How to", href: "/en/how-to" },
      experiences: { title: "Experiences", href: "/en/experiences" },
    } as any);

    expect(screen.queryByText("Pick a path below")).not.toBeInTheDocument();
    expect(screen.getByText("How to")).toBeInTheDocument();
    expect(screen.getByText("Experiences")).toBeInTheDocument();
    expect(screen.queryByText("Travel tips")).not.toBeInTheDocument();
  });
});