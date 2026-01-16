// src/components/guides/TransportNotice.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual<typeof import("react-i18next")>("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) =>
        (options && Object.prototype.hasOwnProperty.call(options, "defaultValue")
          ? (options as { defaultValue?: unknown }).defaultValue
          : key),
    }),
  };
});

import TransportNotice from "./TransportNotice";

describe("TransportNotice", () => {
  it("renders supplied translations when i18n is unavailable", () => {
    const { getByText, getByLabelText } = render(
      <TransportNotice
        translations={{
          title: "Travel smart",
          srLabel: "Travel info",
          items: {
            ferries: "Ferries: check operators.",
          },
        }}
      />,
    );

    expect(getByText("Travel smart")).toBeInTheDocument();
    expect(getByLabelText("Travel info")).toBeInTheDocument();
    expect(getByText("Ferries: check operators.")).toBeInTheDocument();
  });
});