import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { Locale } from "@acme/i18n";

import MultilingualFields from "../src/components/cms/MultilingualFields";

describe("MultilingualFields", () => {
  function Wrapper() {
    const locales: readonly Locale[] = ["en", "de"];
    const [product, setProduct] = useState({
      title: { en: "", de: "" },
      description: { en: "", de: "" },
    });

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      const [field, locale] = name.split("_");
      setProduct((prev) => ({
        ...prev,
        [field === "desc" ? "description" : "title"]: {
          ...(field === "desc" ? prev.description : prev.title),
          [locale]: value,
        },
      }));
    };

    return (
      <MultilingualFields
        locales={locales}
        product={product}
        onChange={handleChange}
      />
    );
  }

  it("renders fields for each locale and updates values when switching", () => {
    render(<Wrapper />);

    const english = screen.getByText("English").closest("div")!;
    const german = screen.getByText("Deutsch").closest("div")!;

    const enTitle = within(english).getByLabelText("Title") as HTMLInputElement;
    const deTitle = within(german).getByLabelText("Title") as HTMLInputElement;

    fireEvent.change(enTitle, { target: { value: "Hello" } });
    expect(enTitle.value).toBe("Hello");

    fireEvent.change(deTitle, { target: { value: "Hallo" } });
    expect(deTitle.value).toBe("Hallo");
    expect(enTitle.value).toBe("Hello");

    const enDesc = within(english).getByLabelText("Description") as HTMLTextAreaElement;
    const deDesc = within(german).getByLabelText("Description") as HTMLTextAreaElement;

    fireEvent.change(enDesc, { target: { value: "EN desc" } });
    expect(enDesc.value).toBe("EN desc");

    fireEvent.change(deDesc, { target: { value: "DE besch" } });
    expect(deDesc.value).toBe("DE besch");
    expect(enDesc.value).toBe("EN desc");
  });
});
