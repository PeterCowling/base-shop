import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent } from "@testing-library/react";

import GuidesLayout from "../layout";
import {
  renderWithRouter,
  resetGuideTestState,
  setCurrentLanguage,
  setTranslations,
} from "./guides.test-utils";

const navigateMock = vi.fn();
const loaderData = { lang: "it" };

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useLoaderData: () => loaderData,
    useNavigate: () => navigateMock,
  };
});

describe("guides layout navigation behaviour", () => {
  beforeEach(() => {
    resetGuideTestState();
    navigateMock.mockClear();
    loaderData.lang = "it";
    setCurrentLanguage("it");
    setTranslations("it", "guides", {
      "labels.backLink": "Back",
    });
    setTranslations("en", "guides", {
      "labels.backLink": "Back",
    });
  });

  it("navigates back through the router when browser history has entries", () => {
    const { getByRole } = renderWithRouter(<GuidesLayout />);

    const backLink = getByRole("link", { name: "Back" });
    const lengthSpy = vi.spyOn(window.history, "length", "get").mockReturnValue(3);
    act(() => {
      fireEvent.click(backLink);
    });

    expect(navigateMock).toHaveBeenCalledWith(-1);
    expect(backLink).toHaveAttribute("href", "/it/guide");
    lengthSpy.mockRestore();
  });

  it("falls back to normal navigation when no history entries are available", () => {
    loaderData.lang = "en";
    setCurrentLanguage("en");
    setTranslations("en", "guides", {
      "labels.backLink": "Back",
    });

    const { getByRole } = renderWithRouter(<GuidesLayout />);
    const backLink = getByRole("link", { name: "Back" });

    const lengthSpy = vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    act(() => {
      fireEvent.click(backLink);
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(backLink).toHaveAttribute("href", "/en/guides");

    lengthSpy.mockRestore();
  });
});