import type { CartLine } from "../../cart";
import { convertCurrency,priceForDays } from "../../pricing";
import { buildLineItemsForItem } from "../lineItems";

jest.mock("../../pricing", () => ({
  priceForDays: jest.fn(),
  convertCurrency: jest.fn(),
}));

const priceForDaysMock = priceForDays as jest.MockedFunction<typeof priceForDays>;
const convertCurrencyMock = convertCurrency as jest.MockedFunction<typeof convertCurrency>;

describe("buildLineItemsForItem", () => {
  beforeEach(() => {
    priceForDaysMock.mockReset();
    convertCurrencyMock.mockReset();
  });

  test("adds deposit line when sku.deposit > 0", async () => {
    priceForDaysMock.mockResolvedValue(100);
    convertCurrencyMock.mockImplementation((value: number) => Promise.resolve(value));

    const item: CartLine = {
      sku: { title: "Tent", deposit: 50 } as any,
      qty: 1,
    };

    const lines = await buildLineItemsForItem(item, 3, 0, "USD");

    expect(lines).toHaveLength(2);
    expect(lines[0].price_data?.product_data?.name).toBe("Tent");
    expect(lines[1].price_data?.product_data?.name).toBe("Tent deposit");
  });

  test("only rental line when sku.deposit = 0", async () => {
    priceForDaysMock.mockResolvedValue(100);
    convertCurrencyMock.mockImplementation((value: number) => Promise.resolve(value));

    const item: CartLine = {
      sku: { title: "Bike", deposit: 0 } as any,
      qty: 1,
    };

    const lines = await buildLineItemsForItem(item, 3, 0, "USD");

    expect(lines).toHaveLength(1);
    expect(lines[0].price_data?.product_data?.name).toBe("Bike");
  });
});

