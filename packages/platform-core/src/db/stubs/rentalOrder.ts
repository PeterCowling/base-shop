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

type ShopSessionIdWhere = { shop_sessionId: { shop: string; sessionId: string } };

type ShopTrackingNumberWhere = {
  shop_trackingNumber: { shop: string; trackingNumber: string | null };
};

type FindUniqueWhere =
  | ShopSessionIdWhere
  | ShopTrackingNumberWhere
  | Record<string, unknown>;

interface FindUniqueArgs {
  where: FindUniqueWhere;
}

interface UpdateArgs {
  where: ShopSessionIdWhere | ShopTrackingNumberWhere;
  data: Partial<RentalOrder>;
}

function hasShopSessionIdWhere(
  where: FindUniqueWhere,
): where is ShopSessionIdWhere {
  return (
    typeof where === "object" &&
    where !== null &&
    "shop_sessionId" in where &&
    typeof where.shop_sessionId === "object" &&
    where.shop_sessionId !== null
  );
}

function hasShopTrackingNumberWhere(
  where: FindUniqueWhere,
): where is ShopTrackingNumberWhere {
  return (
    typeof where === "object" &&
    where !== null &&
    "shop_trackingNumber" in where &&
    typeof where.shop_trackingNumber === "object" &&
    where.shop_trackingNumber !== null
  );
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
      if (hasShopSessionIdWhere(where)) {
        const { shop, sessionId } = where.shop_sessionId;
        return (
          rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId) ||
          null
        );
      }

      if (hasShopTrackingNumberWhere(where)) {
        const { shop, trackingNumber } = where.shop_trackingNumber;
        return (
          rentalOrders.find(
            (o) => o.shop === shop && o.trackingNumber === trackingNumber,
          ) || null
        );
      }

      return null;
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
      } else {
        const { shop, trackingNumber } = where.shop_trackingNumber;
        order = rentalOrders.find(
          (o) => o.shop === shop && o.trackingNumber === trackingNumber,
        );
      }
      if (!order) throw new Error("Order not found");
      Object.assign(order, data);
      return order;
    },
  } satisfies RentalOrderDelegate;
}
