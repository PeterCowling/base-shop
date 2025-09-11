export type RentalOrder = {
  shop: string;
  sessionId: string;
  trackingNumber?: string | null;
  customerId?: string | null;
  [key: string]: any;
};

export function createRentalOrderDelegate() {
  const rentalOrders: RentalOrder[] = [];
  return {
    findMany: async ({ where }: any = {}) =>
      rentalOrders.filter((o) => {
        if (!where) return true;
        if (where.shop && o.shop !== where.shop) return false;
        if (where.customerId && o.customerId !== where.customerId) return false;
        return true;
      }),
    findUnique: async ({ where }: any) => {
      if (where?.shop_sessionId) {
        const { shop, sessionId } = where.shop_sessionId;
        return (
          rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId) ||
          null
        );
      }
      return null;
    },
    create: async ({ data }: { data: RentalOrder }) => {
      rentalOrders.push({ ...data });
      return data;
    },
    update: async ({ where, data }: any) => {
      let order: RentalOrder | undefined;
      if ("shop_sessionId" in where) {
        const { shop, sessionId } = where.shop_sessionId;
        order = rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId);
      } else if ("shop_trackingNumber" in where) {
        const { shop, trackingNumber } = where.shop_trackingNumber;
        order = rentalOrders.find(
          (o) => o.shop === shop && o.trackingNumber === trackingNumber,
        );
      }
      if (!order) throw new Error("Order not found");
      Object.assign(order, data);
      return order;
    },
  } as any;
}
