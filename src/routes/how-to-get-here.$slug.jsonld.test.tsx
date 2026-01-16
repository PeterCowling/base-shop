import type { LoaderData } from "./how-to-get-here/types";
import { render } from "@testing-library/react";
import { findJsonLdByType } from "@tests/jsonld";
import { asContentKey } from "@tests/brands";
import { describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import HowToGetHereDynamicRoute from "./how-to-get-here.$slug";

const loaderData: LoaderData = {
  lang: "en",
  slug: "with-steps",
  howToSlug: "how-to",
  guidesSlug: "guides",
  showChiesaNuovaDetails: false,
  definition: {
    slug: "with-steps",
    contentKey: asContentKey("key"),
    linkBindings: [],
    media: [],
    galleries: [],
    linkLists: [],
  },
  content: {
    meta: { title: "T", description: "D" },
    steps: ["Step one", { title: "Step two", body: "Details" }],
  },
};

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useLoaderData: () => loaderData,
  };
});

describe("how-to-get-here JSON-LD", () => {
  it("renders HowTo structured data when steps are present", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HowToGetHereDynamicRoute />
      </I18nextProvider>,
    );

    expect(findJsonLdByType("HowTo")).toBeTruthy();
  });
});