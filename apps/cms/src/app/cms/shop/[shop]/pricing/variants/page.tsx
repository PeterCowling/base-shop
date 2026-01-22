import { notFound, redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import type { Role } from "@acme/auth/types";
import { readVariants } from "@acme/platform-core/repositories/variants.server";
import { checkShopExists } from "@acme/platform-core/shops";
import { type VariantPricing,variantPricingSchema } from "@acme/platform-core/types/variants";
import { Tag } from "@acme/ui/components/atoms";

import { Card, CardContent } from "@/components/atoms/shadcn";

import VariantPricingClient from "./variantPricing.client";

export const revalidate = 0;

function getRole(session: Session | null): Role | null {
  const role = session?.user?.role;
  if (typeof role !== "string") return null;
  return role as Role;
}

export default async function VariantPricingPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();

  const session = await getServerSession(authOptions);
  const role = getRole(session);
  if (!role || !hasPermission(role, "manage_catalog")) {
    redirect(
      `/403?shop=${encodeURIComponent(shop)}&reason=${encodeURIComponent(
        "manage_catalog"
      )}`
    );
  }

  if (shop !== "cochlearfit") {
    redirect(`/cms/shop/${shop}/products`);
  }

  let variants: VariantPricing[] = [];
  try {
    variants = (await readVariants(shop)).map((v) => variantPricingSchema.parse(v));
  } catch {
    variants = [];
  }

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/15 to-transparent" />
        <div className="relative space-y-3 px-6 py-7">
          <Tag variant="default">Variant pricing · cochlearfit</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">Checkout pricing & Stripe IDs</h1>
          <p className="text-sm text-hero-foreground/80">
            Edit the source of truth for cochlearfit checkout variant pricing and Stripe price IDs.
            Changes are committed to <code>data/shops/cochlearfit/variants.json</code> and used by the worker at checkout.
          </p>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 shadow-elevation-3">
          <CardContent className="space-y-4 px-6 py-6">
            <VariantPricingClient shop={shop} initial={variants} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
