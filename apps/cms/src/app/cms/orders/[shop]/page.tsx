// apps/cms/src/app/cms/orders/[shop]/page.tsx
import { readOrders, markReturned, markRefunded } from "@platform-core/orders";
import type { RentalOrder } from "@acme/types";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Tag, Progress } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";
import Link from "next/link";

export default async function ShopOrdersPage({
  params,
}: {
  params: { shop: string };
}) {
  const shop = params.shop;
  const orders: RentalOrder[] = await readOrders(shop);

  const totalOrders = orders.length;
  const flaggedOrders = orders.filter((order) => order.flaggedForReview);
  const highRiskOrders = orders.filter(
    (order) => (order.riskLevel ?? "").toString().toLowerCase() === "high"
  );
  const expectedReturns = orders.filter((order) => Boolean(order.expectedReturnDate));

  const now = Date.now();
  const overdueReturns = expectedReturns.filter((order) => {
    const expected = order.expectedReturnDate;
    if (!expected) return false;
    const date = new Date(expected);
    return Number.isFinite(date.getTime()) && date.getTime() < now;
  });

  const readiness = totalOrders
    ? Math.max(0, Math.min(100, 100 - Math.round((overdueReturns.length / totalOrders) * 100)))
    : 0;

  const quickStats = [
    {
      label: "Placed",
      value: String(totalOrders),
      caption: "Orders recorded for this shop",
      accent: "bg-white/10 text-white",
    },
    {
      label: "Flagged",
      value: String(flaggedOrders.length),
      caption: "Require manual review",
      accent: "bg-rose-500/20 text-rose-200",
    },
    {
      label: "High risk",
      value: String(highRiskOrders.length),
      caption: "Risk level marked high",
      accent: "bg-amber-500/20 text-amber-200",
    },
    {
      label: "Overdue returns",
      value: String(overdueReturns.length),
      caption: "Past the expected return date",
      accent: "bg-sky-500/20 text-sky-200",
    },
  ];

  async function returnAction(formData: FormData) {
    "use server";
    const sessionId = formData.get("sessionId")?.toString();
    if (sessionId) {
      await markReturned(shop, sessionId);
    }
  }

  async function refundAction(formData: FormData) {
    "use server";
    const sessionId = formData.get("sessionId")?.toString();
    if (sessionId) {
      await markRefunded(shop, sessionId);
    }
  }

  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.25),_transparent_55%)]" />
        <div className="relative grid gap-6 px-6 py-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-5">
            <div className="space-y-2">
              <Tag variant="default" className="bg-white/10 text-white/70">
                Orders · {shop}
              </Tag>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Keep every rental on track and customers delighted
              </h1>
              <p className="text-sm text-white/70">
                Monitor flagged orders, overdue returns, and risk signals before they impact your launch timeline.
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={readiness} label={`${readiness}% of orders on schedule`} />
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/cms/shop/${shop}/settings/returns`}
                  className="inline-flex h-11 items-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Review return policies
                </Link>
                <Link
                  href={`/cms/shop/${shop}/data/return-logistics`}
                  className="inline-flex h-11 items-center rounded-xl border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Open logistics data
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-2xl border border-white/10 px-4 py-3 backdrop-blur",
                    stat.accent
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                    {stat.label}
                  </p>
                  <p className="text-xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.caption}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-white/10 bg-white/5 text-white shadow-lg backdrop-blur">
            <CardContent className="space-y-3 px-5 py-5 text-sm text-white/80">
              <h2 className="text-base font-semibold text-white">Return triage tips</h2>
              <p>• Prioritise overdue items and contact customers directly.</p>
              <p>• Review high-risk orders before approving refunds.</p>
              <p>• Keep an eye on flagged orders to avoid chargebacks.</p>
              {!!flaggedOrders.length && (
                <Tag variant="warning" className="bg-amber-500/20 text-amber-100">
                  {flaggedOrders.length} orders require manual review
                </Tag>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <Card className="border border-white/10 bg-slate-950/70 shadow-lg">
          <CardContent className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-white">
              <div>
                <h2 className="text-lg font-semibold">Order queue</h2>
                <p className="text-sm text-white/70">
                  Process returns, refunds, and risk reviews from a single command center.
                </p>
              </div>
              <Tag variant="default" className="bg-white/10 text-white/70">
                {totalOrders} total orders
              </Tag>
            </div>
            <ul className="grid gap-3" role="list">
              {orders.map((order) => {
                const expected = order.expectedReturnDate
                  ? new Date(order.expectedReturnDate)
                  : null;
                const isOverdue = expected
                  ? Number.isFinite(expected.getTime()) && expected.getTime() < now
                  : false;
                const riskLevel = order.riskLevel ?? "Unknown";
                const riskScore = typeof order.riskScore === "number" ? order.riskScore : "N/A";
                const riskLevelLower = riskLevel.toString().toLowerCase();
                const highlight =
                  order.flaggedForReview || riskLevelLower === "high" || isOverdue;

                return (
                  <li
                    key={order.id ?? order.sessionId}
                    className={cn(
                      "list-none rounded-2xl border border-transparent",
                      highlight && "border-red-500 bg-red-50"
                    )}
                  >
                    <Card
                      className={cn(
                        "border border-white/10 bg-white/5 text-white",
                        order.flaggedForReview && "border-rose-400/40 bg-rose-500/10",
                        isOverdue && "border-amber-400/40 bg-amber-500/10"
                      )}
                    >
                      <CardContent className="space-y-3 px-5 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">
                              Order: {order.id ?? "unknown"}
                            </div>
                            <p className="text-xs text-white/70">
                              Session: {order.sessionId ?? "—"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {order.flaggedForReview && (
                              <Tag variant="warning" className="bg-rose-500/20 text-rose-100">
                                Flagged for review
                              </Tag>
                            )}
                            <Tag
                              variant={riskLevelLower === "high" ? "destructive" : "default"}
                              className={cn(
                                "bg-white/15 text-white",
                                riskLevelLower === "high" && "bg-rose-500/30 text-rose-100"
                              )}
                            >
                              Risk Level: {riskLevel}
                            </Tag>
                            <Tag className="bg-white/10 text-white/80" variant="default">
                              Risk Score: {riskScore}
                            </Tag>
                          </div>
                        </div>
                        <p className="text-sm text-white/80">
                          {order.expectedReturnDate ? (
                            <>
                              Return: {order.expectedReturnDate}
                              {expected && Number.isFinite(expected.getTime()) && (
                                <span
                                  aria-hidden="true"
                                  className="ml-2 text-white/70"
                                >
                                  ({expected.toLocaleDateString()})
                                </span>
                              )}
                              {isOverdue && (
                                <span className="text-amber-200"> (overdue)</span>
                              )}
                            </>
                          ) : (
                            <>Return: —</>
                          )}
                        </p>
                        <div className="text-sm text-white/70">
                          Flagged for Review: {order.flaggedForReview ? "Yes" : "No"}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <form action={returnAction}>
                            <input type="hidden" name="sessionId" value={order.sessionId ?? ""} />
                            <Button
                              type="submit"
                              variant="outline"
                              className="h-9 rounded-lg border-white/30 bg-white/10 text-white hover:bg-white/20"
                            >
                              Mark returned
                            </Button>
                          </form>
                          <form action={refundAction}>
                            <input type="hidden" name="sessionId" value={order.sessionId ?? ""} />
                            <Button
                              type="submit"
                              variant="ghost"
                              className="h-9 rounded-lg text-white hover:bg-white/10"
                            >
                              Refund order
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
              {orders.length === 0 && (
                <li className="list-none">
                  <Card className="border border-white/10 bg-white/5 text-white">
                    <CardContent className="px-6 py-8 text-center text-sm text-white/70">
                      No orders found for this shop yet.
                    </CardContent>
                  </Card>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
