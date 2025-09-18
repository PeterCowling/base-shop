export type RentalOrder = {
  shop: string;
  sessionId: string;
  trackingNumber?: string | null;
  customerId?: string | null;
  [key: string]: unknown;
};

interface FindManyArgs {
  where?: {
    shop?: string;
    customerId?: string | null;
  };
}

interface FindUniqueArgs {
  where: { shop_sessionId: { shop: string; sessionId: string } };
}

interface UpdateArgs {
  where:
    | { shop_sessionId: { shop: string; sessionId: string } }
    | { shop_trackingNumber: { shop: string; trackingNumber: string | null } };
  data: Partial<RentalOrder>;
}

interface RentalOrderDelegate {
  findMany(args?: FindManyArgs): Promise<RentalOrder[]>;
  findUnique(args: FindUniqueArgs): Promise<RentalOrder | null>;
  create(args: { data: RentalOrder }): Promise<RentalOrder>;
  update(args: UpdateArgs): Promise<RentalOrder>;
}

export function createRentalOrderDelegate(): RentalOrderDelegate {
  const rentalOrders: RentalOrder[] = [];
  return {
    async findMany({ where }: FindManyArgs = {}) {
      return rentalOrders.filter((o) => {
        if (!where) return true;
        if (where.shop && o.shop !== where.shop) return false;
        if (where.customerId && o.customerId !== where.customerId) return false;
        return true;
      });
    },
    async findUnique({ where }: FindUniqueArgs) {
      const { shop, sessionId } = where.shop_sessionId;
      return (
        rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId) ||
        null
      );
    },
    async create({ data }) {
      rentalOrders.push({ ...data });
      return data;
    },
    async update({ where, data }: UpdateArgs) {
      let order: RentalOrder | undefined;
      if ("shop_sessionId" in where) {
        const { shop, sessionId } = where.shop_sessionId;
        order = rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId);
      } else if ("shop_trackingNumber" in where) {
        const shopTrackingFilter = where.shop_trackingNumber;
        if (shopTrackingFilter) {
          const { shop, trackingNumber } = shopTrackingFilter;
          order = rentalOrders.find(
            (o) => o.shop === shop && o.trackingNumber === trackingNumber,
          );
        }
      }
      if (!order) throw new Error("Order not found");
      Object.assign(order, data);
      return order;
    },
  } satisfies RentalOrderDelegate;
}
