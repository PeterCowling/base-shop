import {
  errorResult,
  formatError,
  jsonResult,
  paginationSchema,
  shopIdSchema,
} from "../utils/validation.js";

const shopAnalyticsSchema = shopIdSchema;
const listEventsSchema = shopIdSchema.merge(paginationSchema);

export const analyticsTools = [
  {
    name: "analytics_aggregates",
    description: "Get aggregated analytics (page views, orders) for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
      },
      required: ["shopId"],
    },
  },
  {
    name: "analytics_events",
    description: "List recent analytics events for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
        limit: { type: "number", description: "Max results", default: 50 },
        offset: { type: "number", description: "Skip N results", default: 0 },
      },
      required: ["shopId"],
    },
  },
  {
    name: "analytics_summary",
    description: "Get a quick summary of shop performance metrics",
    inputSchema: {
      type: "object",
      properties: {
        shopId: { type: "string", description: "The shop ID" },
      },
      required: ["shopId"],
    },
  },
] as const;

// Define types that match platform-core's AnalyticsAggregates
interface ShopAggregates {
  page_view?: Record<string, number>;
  order?: Record<string, { count: number; amount: number }>;
  discount_redeemed?: Record<string, Record<string, number>>;
  ai_crawl?: Record<string, number>;
}

export async function handleAnalyticsTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "analytics_aggregates": {
        const { shopId } = shopAnalyticsSchema.parse(args);
        const { readAggregates } = await import("@acme/platform-core/repositories/analytics.server");
        const aggregates = await readAggregates(shopId);

        return jsonResult({
          shopId,
          aggregates,
        });
      }

      case "analytics_events": {
        const { shopId, limit, offset } = listEventsSchema.parse(args);
        const { listEvents } = await import("@acme/platform-core/repositories/analytics.server");
        const events = await listEvents(shopId);

        const paginatedEvents = events.slice(offset, offset + limit);

        return jsonResult({
          shopId,
          count: events.length,
          showing: paginatedEvents.length,
          offset,
          events: paginatedEvents,
        });
      }

      case "analytics_summary": {
        const { shopId } = shopAnalyticsSchema.parse(args);

        // Get analytics aggregates
        const { readAggregates } = await import("@acme/platform-core/repositories/analytics.server");
        const aggregates = await readAggregates(shopId) as ShopAggregates;

        // Process aggregates to extract summary stats
        const summary = processAggregates(aggregates);

        return jsonResult({
          shopId,
          summary,
          insights: generateInsights(summary),
        });
      }

      default:
        return errorResult(`Unknown analytics tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}

interface SummaryStats {
  totalPageViews: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  recentDays: number;
  recentPageViews: number;
  recentOrders: number;
  recentRevenue: number;
}

function processAggregates(aggregates: ShopAggregates): SummaryStats {
  const pageViews = aggregates.page_view || {};
  const orders = aggregates.order || {};

  // Calculate totals
  let totalPageViews = 0;
  let totalOrders = 0;
  let totalRevenue = 0;

  for (const count of Object.values(pageViews)) {
    totalPageViews += count;
  }

  for (const day of Object.values(orders)) {
    totalOrders += day.count;
    totalRevenue += day.amount;
  }

  // Calculate recent stats (last 7 days)
  const now = new Date();
  const recentDays = 7;
  let recentPageViews = 0;
  let recentOrders = 0;
  let recentRevenue = 0;

  for (let i = 0; i < recentDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    if (pageViews[dateStr]) {
      recentPageViews += pageViews[dateStr];
    }
    if (orders[dateStr]) {
      recentOrders += orders[dateStr].count;
      recentRevenue += orders[dateStr].amount;
    }
  }

  return {
    totalPageViews,
    totalOrders,
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    recentDays,
    recentPageViews,
    recentOrders,
    recentRevenue,
  };
}

function generateInsights(summary: SummaryStats): string[] {
  const insights: string[] = [];

  if (summary.totalOrders === 0) {
    insights.push("No orders yet - focus on driving traffic and conversions");
  } else {
    if (summary.recentOrders === 0) {
      insights.push("No orders in the last 7 days - consider running a promotion");
    }

    if (summary.averageOrderValue < 50 && summary.totalOrders > 0) {
      insights.push("Average order value is low - consider upselling or bundling products");
    }

    if (summary.totalPageViews > 0 && summary.totalOrders > 0) {
      const conversionRate = (summary.totalOrders / summary.totalPageViews) * 100;
      if (conversionRate < 1) {
        insights.push(`Conversion rate is ${conversionRate.toFixed(2)}% - consider improving product pages`);
      } else if (conversionRate > 3) {
        insights.push(`Strong conversion rate of ${conversionRate.toFixed(2)}%`);
      }
    }
  }

  if (insights.length === 0) {
    insights.push("Metrics look healthy - continue monitoring");
  }

  return insights;
}
