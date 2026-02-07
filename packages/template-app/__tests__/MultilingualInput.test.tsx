/** @jest-environment jsdom */
import { fireEvent,render, screen } from "@testing-library/react";

import MultilingualFields from "@acme/cms-ui/MultilingualFields";
import type { Locale } from "@acme/i18n";

describe("MultilingualInput", () => {
  it("calls onChange with correct locale key/value", () => {
    const locales: readonly Locale[] = ["en", "de"];
    const product = {
      title: { en: "", de: "" },
      description: { en: "", de: "" },
    };
    const calls: { name: string; value: string }[] = [];
    const onChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      calls.push({ name, value });
    };

    render(
      <MultilingualFields locales={locales} product={product} onChange={onChange} />
    );

    const titleInputs = screen.getAllByLabelText("Title");
    fireEvent.change(titleInputs[0], { target: { value: "Hello" } });
    fireEvent.change(titleInputs[1], { target: { value: "Hallo" } });

    expect(calls).toEqual([
      { name: "title_en", value: "Hello" },
      { name: "title_de", value: "Hallo" },
    ]);

    calls.length = 0;
    const descInputs = screen.getAllByLabelText("Description");
    fireEvent.change(descInputs[0], { target: { value: "EN desc" } });
    fireEvent.change(descInputs[1], { target: { value: "DE besch" } });

    expect(calls).toEqual([
      { name: "desc_en", value: "EN desc" },
      { name: "desc_de", value: "DE besch" },
    ]);
  });
});

