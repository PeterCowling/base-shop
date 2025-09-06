import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@cms/actions/shops.server", () => ({
  updateCurrencyAndTax: jest.fn(),
}));

jest.mock("../../../../../../services/shops/validation", () => ({
  parseCurrencyTaxForm: jest.fn(),
}));

import { updateCurrencyAndTax } from "@cms/actions/shops.server";
import { parseCurrencyTaxForm } from "../../../../../../services/shops/validation";
import CurrencyTaxEditor from "../CurrencyTaxEditor";

const mockUpdateCurrencyAndTax = updateCurrencyAndTax as jest.Mock;
const mockParseCurrencyTaxForm = parseCurrencyTaxForm as jest.Mock;

jest.mock(
  "@ui/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

const OriginalFormData = global.FormData;
beforeAll(() => {
  global.FormData = class extends OriginalFormData {
    constructor(form?: HTMLFormElement) {
      super();
      if (form) {
        Array.from(form.elements).forEach((el: any) => {
          if (el.name) this.append(el.name, el.value);
        });
      }
    }
  } as any;
});

afterAll(() => {
  global.FormData = OriginalFormData;
  jest.resetModules();
});

beforeEach(() => {
  mockParseCurrencyTaxForm.mockReset();
  mockUpdateCurrencyAndTax.mockReset();
  mockUpdateCurrencyAndTax.mockImplementation(async (_shop: string, formData: FormData) => {
    const result = mockParseCurrencyTaxForm(formData);
    return result.data ? { settings: result.data } : { errors: result.errors };
  });
});

describe("CurrencyTaxEditor", () => {
  it("submits edited values", async () => {
    mockParseCurrencyTaxForm.mockReturnValue({
      data: { currency: "EUR", taxRegion: "EU" },
    });

    const user = userEvent.setup();
    render(
      <CurrencyTaxEditor shop="test-shop" initial={{ currency: "USD", taxRegion: "US" }} />,
    );

    const currencyInput = screen.getByLabelText("Currency");
    const taxRegionInput = screen.getByLabelText("Tax Region");

    await user.clear(currencyInput);
    await user.type(currencyInput, "EUR");
    await user.clear(taxRegionInput);
    await user.type(taxRegionInput, "EU");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mockParseCurrencyTaxForm).toHaveBeenCalled());

    const formData = mockParseCurrencyTaxForm.mock.calls[0][0] as FormData;
    expect(formData.get("currency")).toBe("EUR");
    expect(formData.get("taxRegion")).toBe("EU");
    expect(mockUpdateCurrencyAndTax).toHaveBeenCalled();
  });

  it("displays errors from action", async () => {
    mockParseCurrencyTaxForm.mockReturnValue({
      data: undefined,
      errors: { currency: ["Required"], taxRegion: ["Required"] },
    });

    const user = userEvent.setup();
    render(
      <CurrencyTaxEditor shop="test-shop" initial={{ currency: "", taxRegion: "" }} />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockParseCurrencyTaxForm).toHaveBeenCalled();
      expect(screen.getAllByText("Required")).toHaveLength(2);
    });
  });
});

