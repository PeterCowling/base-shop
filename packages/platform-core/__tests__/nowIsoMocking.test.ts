import { jest } from "@jest/globals";

const createMock = jest.fn(async ({ data }: any) => data);

jest.mock("../src/db", () => ({
  prisma: {
    rentalOrder: { create: createMock },
  },
}));

jest.mock("../src/analytics", () => ({ trackOrder: jest.fn() }));

jest.mock("@date-utils", () => ({ nowIso: jest.fn(() => "2000-01-01T00:00:00.000Z") }));

describe("nowIso mocking", () => {
  it("uses mocked nowIso in addOrder", async () => {
    const { addOrder } = await import("../src/orders/creation");
    const order = await addOrder({ shop: "shop", sessionId: "sess", deposit: 10 });
    expect(order.startedAt).toBe("2000-01-01T00:00:00.000Z");
  });
});
