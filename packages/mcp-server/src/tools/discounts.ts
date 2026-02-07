import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

interface Coupon {
  code: string;
  description?: string;
  discountPercent: number;
  validFrom?: string;
  validTo?: string;
}

export const discountTools = [
  {
    name: "discount_list",
    description: "List all discount codes/coupons for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
      },
      required: ["shop"],
    },
  },
  {
    name: "discount_get",
    description: "Get details for a specific discount code",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
        code: {
          type: "string",
          description: "Discount code (case-insensitive)",
        },
      },
      required: ["shop", "code"],
    },
  },
  {
    name: "discount_validate",
    description: "Check if a discount code is currently valid (within date range)",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
        code: {
          type: "string",
          description: "Discount code to validate",
        },
      },
      required: ["shop", "code"],
    },
  },
  {
    name: "discount_stats",
    description: "Get discount code statistics including redemption counts from analytics",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
      },
      required: ["shop"],
    },
  },
] as const;

export async function handleDiscountTool(name: string, args: unknown) {
  try {
    const params = (args || {}) as Record<string, unknown>;

    switch (name) {
      case "discount_list": {
        const shop = params.shop as string;
        if (!shop) {
          return errorResult("Shop ID is required");
        }

        const { readCouponRepo } = await import(
          "@acme/platform-core/repositories/coupons.server"
        );

        const coupons = await readCouponRepo(shop);
        const now = new Date();

        const enriched = coupons.map((c: Coupon) => {
          const validFrom = c.validFrom ? new Date(c.validFrom) : null;
          const validTo = c.validTo ? new Date(c.validTo) : null;

          let status: "active" | "expired" | "upcoming" | "no_dates" = "no_dates";
          if (validFrom && validTo) {
            if (now < validFrom) status = "upcoming";
            else if (now > validTo) status = "expired";
            else status = "active";
          } else if (validFrom && now < validFrom) {
            status = "upcoming";
          } else if (validTo && now > validTo) {
            status = "expired";
          } else if (validFrom || validTo) {
            status = "active";
          }

          return {
            code: c.code,
            discountPercent: c.discountPercent,
            description: c.description,
            status,
            validFrom: c.validFrom,
            validTo: c.validTo,
          };
        });

        const active = enriched.filter((c) => c.status === "active").length;
        const expired = enriched.filter((c) => c.status === "expired").length;
        const upcoming = enriched.filter((c) => c.status === "upcoming").length;

        return jsonResult({
          shop,
          coupons: enriched,
          summary: {
            total: coupons.length,
            active,
            expired,
            upcoming,
            noDates: enriched.filter((c) => c.status === "no_dates").length,
          },
        });
      }

      case "discount_get": {
        const shop = params.shop as string;
        const code = params.code as string;
        if (!shop) return errorResult("Shop ID is required");
        if (!code) return errorResult("Discount code is required");

        const { getCouponByCode } = await import(
          "@acme/platform-core/repositories/coupons.server"
        );

        const coupon = await getCouponByCode(shop, code);
        if (!coupon) {
          return jsonResult({
            shop,
            code,
            found: false,
            message: `No discount code '${code}' found for shop '${shop}'`,
          });
        }

        const now = new Date();
        const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
        const validTo = coupon.validTo ? new Date(coupon.validTo) : null;

        let isValid = true;
        let reason: string | null = null;
        if (validFrom && now < validFrom) {
          isValid = false;
          reason = `Not yet valid (starts ${coupon.validFrom})`;
        } else if (validTo && now > validTo) {
          isValid = false;
          reason = `Expired (ended ${coupon.validTo})`;
        }

        return jsonResult({
          shop,
          found: true,
          coupon: {
            code: coupon.code,
            description: coupon.description,
            discountPercent: coupon.discountPercent,
            validFrom: coupon.validFrom,
            validTo: coupon.validTo,
          },
          validation: {
            isCurrentlyValid: isValid,
            reason,
          },
        });
      }

      case "discount_validate": {
        const shop = params.shop as string;
        const code = params.code as string;
        if (!shop) return errorResult("Shop ID is required");
        if (!code) return errorResult("Discount code is required");

        const { getCouponByCode } = await import(
          "@acme/platform-core/repositories/coupons.server"
        );

        const coupon = await getCouponByCode(shop, code);
        if (!coupon) {
          return jsonResult({
            valid: false,
            reason: "Code not found",
            code,
            shop,
          });
        }

        const now = new Date();
        const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
        const validTo = coupon.validTo ? new Date(coupon.validTo) : null;

        if (validFrom && now < validFrom) {
          return jsonResult({
            valid: false,
            reason: "Not yet active",
            startsAt: coupon.validFrom,
            code,
            shop,
          });
        }

        if (validTo && now > validTo) {
          return jsonResult({
            valid: false,
            reason: "Expired",
            expiredAt: coupon.validTo,
            code,
            shop,
          });
        }

        return jsonResult({
          valid: true,
          code: coupon.code,
          discountPercent: coupon.discountPercent,
          shop,
        });
      }

      case "discount_stats": {
        const shop = params.shop as string;
        if (!shop) return errorResult("Shop ID is required");

        const { readCouponRepo } = await import(
          "@acme/platform-core/repositories/coupons.server"
        );

        const coupons = await readCouponRepo(shop);

        // Try to get redemption data from analytics
        const redemptions: Record<string, number> = {};
        try {
          const { promises: fs } = await import("fs");
          const { join } = await import("path");
          const { resolveDataRoot } = await import(
            "@acme/platform-core/dataRoot"
          );

          const aggPath = join(resolveDataRoot(), shop, "analytics-aggregates.json");
          const data = await fs.readFile(aggPath, "utf8");
          const agg = JSON.parse(data) as {
            discount_redeemed?: Record<string, Record<string, number>>;
          };

          // Aggregate redemptions across all days
          if (agg.discount_redeemed) {
            for (const dayData of Object.values(agg.discount_redeemed)) {
              for (const [code, count] of Object.entries(dayData)) {
                redemptions[code] = (redemptions[code] || 0) + count;
              }
            }
          }
        } catch {
          // No analytics data available
        }

        const stats = coupons.map((c: Coupon) => ({
          code: c.code,
          discountPercent: c.discountPercent,
          redemptions: redemptions[c.code] || 0,
        }));

        const totalRedemptions = Object.values(redemptions).reduce(
          (a, b) => a + b,
          0
        );
        const mostUsed = stats
          .filter((s) => s.redemptions > 0)
          .sort((a, b) => b.redemptions - a.redemptions)
          .slice(0, 5);

        return jsonResult({
          shop,
          stats,
          summary: {
            totalCodes: coupons.length,
            totalRedemptions,
            codesUsed: stats.filter((s) => s.redemptions > 0).length,
            codesNeverUsed: stats.filter((s) => s.redemptions === 0).length,
            mostUsed,
          },
        });
      }

      default:
        return errorResult(`Unknown discount tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
