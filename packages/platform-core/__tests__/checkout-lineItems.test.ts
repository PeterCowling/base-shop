import type { CartLine } from "../src/cart";
import { buildLineItemsForItem } from "../src/checkout/lineItems";
import { convertCurrency,priceForDays } from "../src/pricing";

jest.mock("../src/pricing", () => ({
  priceForDays: jest.fn(async () => 200),
  convertCurrency: jest.fn(async (n: number) => n),
}));

const priceForDaysMock = priceForDays as jest.MockedFunction<typeof priceForDays>;
const convertCurrencyMock = convertCurrency as jest.MockedFunction<typeof convertCurrency>;

describe("buildLineItemsForItem", () => {
  beforeEach(() => {
    priceForDaysMock.mockClear();
    convertCurrencyMock.mockClear();
  });

  it("creates rental line item with discount and deposit when required", async () => {
    const item: CartLine = {
      sku: { title: "Tent", deposit: 50 } as any,
      qty: 2,
    };

    const lines = await buildLineItemsForItem(item, 3, 0.25, "USD");

    expect(lines).toHaveLength(2);

    const rental = lines[0];
    expect(rental.price_data?.currency).toBe("usd");
    expect(rental.price_data?.unit_amount).toBe(150 * 100);
    expect(rental.price_data?.product_data?.name).toBe("Tent");
    expect(rental.quantity).toBe(2);

    const deposit = lines[1];
    expect(deposit.price_data?.product_data?.name).toBe("Tent deposit");
  });

  it("omits deposit line when deposit is zero", async () => {
    const item: CartLine = {
      sku: { title: "Bike", deposit: 0 } as any,
      qty: 1,
    };

    const lines = await buildLineItemsForItem(item, 5, 0, "USD");

    expect(lines).toHaveLength(1);
    const rental = lines[0];
    expect(rental.price_data?.currency).toBe("usd");
    expect(rental.price_data?.product_data?.name).toBe("Bike");
    expect(rental.quantity).toBe(1);
  });
});

