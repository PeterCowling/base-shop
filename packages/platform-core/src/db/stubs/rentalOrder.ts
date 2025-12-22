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
    stripePaymentIntentId?: string | null;
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

interface UpdateManyArgs {
  where?: {
    shop?: string;
    stripePaymentIntentId?: string | null;
  };
  data: Partial<RentalOrder>;
}

function hasShopSessionIdWhere(
  where: FindUniqueWhere,
): where is ShopSessionIdWhere {
  return (
    typeof where === "object" &&
    where !== null &&
    Object.prototype.hasOwnProperty.call(where, "shop_sessionId") &&
    typeof (where as ShopSessionIdWhere).shop_sessionId === "object" &&
    (where as ShopSessionIdWhere).shop_sessionId !== null
  );
}

function hasShopTrackingNumberWhere(
  where: FindUniqueWhere,
): where is ShopTrackingNumberWhere {
  return (
    typeof where === "object" &&
    where !== null &&
    Object.prototype.hasOwnProperty.call(where, "shop_trackingNumber") &&
    typeof (where as ShopTrackingNumberWhere).shop_trackingNumber === "object" &&
    (where as ShopTrackingNumberWhere).shop_trackingNumber !== null
  );
}

interface RentalOrderDelegate {
  findMany(args?: FindManyArgs): Promise<RentalOrder[]>;
  findUnique(args: FindUniqueArgs): Promise<RentalOrder | null>;
  create(args: { data: RentalOrder }): Promise<RentalOrder>;
  update(args: UpdateArgs): Promise<RentalOrder>;
  updateMany(args: UpdateManyArgs): Promise<{ count: number }>;
}

export function createRentalOrderDelegate(): RentalOrderDelegate {
  const rentalOrders: RentalOrder[] = [];
  return {
    async findMany({ where }: FindManyArgs = {}) {
      return rentalOrders.filter((o) => {
        if (!where) return true;
        if (where.shop && o.shop !== where.shop) return false;
        if (where.customerId && o.customerId !== where.customerId) return false;
        if (
          typeof where.stripePaymentIntentId === "string" &&
          o.stripePaymentIntentId !== where.stripePaymentIntentId
        )
          return false;
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
        // The stub intentionally refuses lookups by tracking number so that
        // tests exercise the update path guarded by this key.
        return null;
      }

      return null;
    },
    async create({ data }) {
      rentalOrders.push({ ...data });
      return data;
    },
    async update({ where, data }: UpdateArgs) {
      let order: RentalOrder | undefined;
      if (hasShopSessionIdWhere(where)) {
        const { shop, sessionId } = where.shop_sessionId;
        order = rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId);
      } else if (hasShopTrackingNumberWhere(where)) {
        const { shop, trackingNumber } = where.shop_trackingNumber;
        order = rentalOrders.find(
          (o) => o.shop === shop && o.trackingNumber === trackingNumber,
        );
      }
      if (!order) throw new Error("Order not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
      Object.assign(order, data);
      return order;
    },
    async updateMany({ where, data }: UpdateManyArgs) {
      let count = 0;
      for (const order of rentalOrders) {
        if (where?.shop && order.shop !== where.shop) continue;
        if (
          typeof where?.stripePaymentIntentId === "string" &&
          order.stripePaymentIntentId !== where.stripePaymentIntentId
        )
          continue;
        Object.assign(order, data);
        count += 1;
      }
      return { count };
    },
  } satisfies RentalOrderDelegate;
}
